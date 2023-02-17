import yaml
import os
import json
import jinja2
import gettext
from pathlib import Path

env = jinja2.Environment(
    extensions=['jinja2.ext.i18n'],
    loader=jinja2.FileSystemLoader('./')
)

def load_yaml(file):
    with open(file, 'r') as stream:
        try:
            properties = yaml.safe_load(stream)
            for p in properties:
                if 'val' in properties[p] and type(properties[p]['val']) == str:
                    properties[p]['val'] = eval(properties[p]['val'])
            return properties
        except yaml.YAMLError as exc:
            print(exc)

def estimate_emissions_construction(low_or_high, data):
    return {'val': data['length_double_track']['val']*supplements['construction_emission_per_km_double_track'][low_or_high]*(data['maximum_speed']['val']/160)**2
    + data['length_tunnel']['val']*(1+data['ratio_single_track_tube']['val'])*supplements['construction_emission_per_km_tunnel_tube'][low_or_high]
    + data['length_bridge']['val']*supplements['construction_emission_per_km_bridge'][low_or_high]
    + data['number_stations']['val']*supplements['construction_emission_per_station'][low_or_high]}
 
def estimate_emissions_savings(low_or_high, data):
    return {'val': data['pkm_per_day']['val']*365*data['modal_shift_'+low_or_high]['val']/100/supplements['avg_people_per_car'][low_or_high]*supplements['car_emission_per_km'][low_or_high]}


data = {'projects':[]}
display_dimensions_ids = []
supplements = load_yaml('./data/_supplements.yaml')
dimensions = load_yaml('./data/_dimensions.yaml')
datafiles = os.scandir('./data/')

for file in datafiles:
    if file.is_file():
        id = file.name.split('.')[0]
        if file.name[0] == '_':
            continue
        else:
            project = load_yaml(file)
            project['id'] = {'lbl': id}
            project['emissions_construction_low'] = estimate_emissions_construction('low', project)
            project['emissions_construction_high'] = estimate_emissions_construction('high', project)
            project['emissions_savings_per_year_low'] = estimate_emissions_savings('low', project)
            project['emissions_savings_per_year_high'] = estimate_emissions_savings('high', project)
            data['projects'].append(project)

for key, value in dimensions.items():
    if 'hidden' in value and value['hidden']:
        continue
    display_dimensions_ids.append(key)


json_object = json.dumps(data)
with open('./dist/data.json', 'w') as outfile:
    outfile.write(json_object)

locales = ["en", "de", "fr"]
for locale in locales:
    print(locale)
    tr = gettext.translation(domain='messages', localedir='locale/', languages=[locale])
    tr.install()
    env.install_gettext_translations(tr, newstyle=True)

    tm = env.get_template('index.tmpl.html')
    html = tm.render(dimensions=display_dimensions_ids, locale=locale)
   
    Path("dist/www/"+locale).mkdir(parents=True, exist_ok=True)
    with open("dist/www/"+locale+"/index.html", "w") as outf:
        outf.write(html)