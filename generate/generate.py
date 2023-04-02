import yaml
import csv
import os
import json
import jinja2
import gettext
from pathlib import Path

locales = ["en", "de", "fr"]

env = jinja2.Environment(
    extensions=['jinja2.ext.i18n'],
    loader=jinja2.FileSystemLoader('./')
)

def load_yaml(file):
    with open(file, 'r') as stream:
        try:
            properties = yaml.safe_load(stream)
            return properties
        except yaml.YAMLError as exc:
            print(exc)

def eval_calcs(properties):
    for p in properties:
        if properties[p] and 'val' in properties[p] and type(properties[p]['val']) == str:
            properties[p]['val'] = eval(properties[p]['val'])
    return properties

def write_json(data):
    with open('./dist/data.json', 'w') as outfile:
        json.dump(data, outfile)

def get_unit_translation(tr, key, sg_or_pl):
    return tr.gettext('unit_'+key+'_'+sg_or_pl) if key is not None else ''

def chkey(dict, key):
    return key in dict and dict[key] is not None

def get_dimension_translations(tr, dimensions):
    row = [locale]
    for dim in dimensions:
        key = dim['id']
        row.append(tr.gettext(key))
        unit_str = ''
        if chkey(dim, 'unit'):
            unit_str = get_unit_translation(tr, dim['unit']['numerator'], 'pl')
            if chkey(dim['unit'], 'denominator'):
                unit_str += '/'+get_unit_translation(tr, dim['unit']['denominator'], 'sg')
        row.append(unit_str)
    return row

def make_unit_dataset(dim):
    return ('data-unit-numerator="'+dim['unit']['numerator']+'"' if chkey(dim['unit'], 'numerator') else '') + (' data-unit-denominator="'+dim['unit']['denominator']+'"' if chkey(dim['unit'], 'denominator') else '')

    
def get_unit_translations(tr, dim):
    units = {}
    for dim in dimensions:
        if chkey(dim, 'unit'):
            if chkey(dim['unit'], 'numerator'):
                units[dim['unit']['numerator']] = {}
                units[dim['unit']['numerator']]['sg'] = get_unit_translation(tr, dim['unit']['numerator'], 'sg')
                units[dim['unit']['numerator']]['pl'] = get_unit_translation(tr, dim['unit']['numerator'], 'pl')
            if chkey(dim['unit'], 'denominator'):
                units[dim['unit']['denominator']] = {}
                units[dim['unit']['denominator']]['sg'] = get_unit_translation(tr, dim['unit']['denominator'], 'sg')
                units[dim['unit']['denominator']]['pl'] = get_unit_translation(tr, dim['unit']['denominator'], 'pl')
    return units

def get_project_row(project, dimensions):
    row = ['']
    for dim in dimensions:
        key = dim['id']
        row.append(project[key]['val'] if 'val' in project[key] else project[key]['lbl'])
        row.append(project[key]['src'] if 'src' in project[key] else '')
    return row

def write_csv(data, dimensions, dimensions_translations):
    with open('./dist/rail-projects-comparison.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)

        writer.writerow(['Licensed under', 'CC0', 'https://creativecommons.org/publicdomain/zero/1.0/'])
        writer.writerow([])
        for e in dimensions_translations:
            writer.writerow(e)
        for e in range(10-len(dimensions_translations)-3):
            writer.writerow([])
        for project in data['projects']:
            writer.writerow(get_project_row(project, dimensions))

def estimate_emissions_construction(low_or_high, data):
    return {'val': data['length_double_track']['val']*supplements['construction_emission_per_km_double_track'][low_or_high]*(data['maximum_speed']['val']/160)**2
    + data['length_tunnel_tube']['val']*supplements['construction_emission_per_km_tunnel_tube'][low_or_high]
    + data['length_bridge']['val']*supplements['construction_emission_per_km_bridge'][low_or_high]
    + data['number_stations']['val']*supplements['construction_emission_per_station'][low_or_high]}
 
def estimate_emissions_savings(low_or_high, data):
    return {'val': data['pkm_per_day']['val']*365*data['modal_shift_'+low_or_high]['val']/100/supplements['avg_people_per_car'][low_or_high]*supplements['car_emission_per_km'][low_or_high]}


data = {'license:': 'https://creativecommons.org/publicdomain/zero/1.0/', 'projects':[]}
supplements = load_yaml('./data/_supplements.yaml')
dimensions = load_yaml('./data/_dimensions.yaml')
datafiles = os.scandir('./data/')

for file in datafiles:
    if file.is_file():
        id = file.name.split('.')[0]
        if file.name[0] == '_':
            continue
        else:
            project = eval_calcs(load_yaml(file))
            project['id'] = {'lbl': id}
            project['emissions_construction_low'] = estimate_emissions_construction('low', project)
            project['emissions_construction_high'] = estimate_emissions_construction('high', project)
            project['emissions_savings_per_year_low'] = estimate_emissions_savings('low', project)
            project['emissions_savings_per_year_high'] = estimate_emissions_savings('high', project)
            data['projects'].append(project)

data['projects'].sort(key=lambda d: d['id']['lbl'])

dimensions_translations = []

for locale in locales:
    print(locale)
    tr = gettext.translation(domain='messages', localedir='locale/', languages=[locale])
    tr.install()
    env.install_gettext_translations(tr, newstyle=True)

    dimensions_translations.append(get_dimension_translations(tr, dimensions))
    unit_translations = json.dumps(get_unit_translations(tr, dimensions))

    tm = env.get_template('index.tmpl.html')
    html = tm.render(dimensions=dimensions, projects=data['projects'], locale=locale, make_unit_dataset=make_unit_dataset, unit_translations=unit_translations)
   
    Path("dist/www/"+locale).mkdir(parents=True, exist_ok=True)
    with open("dist/www/"+locale+"/index.html", "w") as outf:
        outf.write(html)

write_json(data)
write_csv(data, dimensions, dimensions_translations)