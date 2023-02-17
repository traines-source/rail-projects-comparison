import yaml
import os
import json

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


data = {'projects':{}, 'dimensions':{}}
supplements = load_yaml('./data/_supplements.yaml')


def estimate_emissions_construction(low_or_high, data):
    return {'val': data['length_double_track']['val']*supplements['construction_emission_per_km_double_track'][low_or_high]*(data['maximum_speed']['val']/160)**2
    + data['length_tunnel']['val']*(1+data['ratio_single_track_tube']['val'])*supplements['construction_emission_per_km_tunnel_tube'][low_or_high]
    + data['length_bridge']['val']*supplements['construction_emission_per_km_bridge'][low_or_high]
    + data['number_stations']['val']*supplements['construction_emission_per_station'][low_or_high]}
 
def estimate_emissions_savings(low_or_high, data):
    return {'val': data['pkm_per_day']['val']*365*data['modal_shift_'+low_or_high]['val']/100/supplements['avg_people_per_car'][low_or_high]*supplements['car_emission_per_km'][low_or_high]}


datafiles = os.scandir('./data/')

for file in datafiles:
    if file.is_file():
        id = file.name.split('.')[0]
        if file.name == '_dimensions.yaml':
            data['dimensions'] = load_yaml(file)
        elif file.name == '_supplements.yaml':
            continue
        else:
            data['projects'][id] = load_yaml(file)
            data['projects'][id]['emissions_construction_low'] = estimate_emissions_construction('low', data['projects'][id])
            data['projects'][id]['emissions_construction_high'] = estimate_emissions_construction('high', data['projects'][id])
            data['projects'][id]['emissions_savings_per_year_low'] = estimate_emissions_savings('low', data['projects'][id])
            data['projects'][id]['emissions_savings_per_year_high'] = estimate_emissions_savings('high', data['projects'][id])


json_object = json.dumps(data)
with open('./dist/data.json', 'w') as outfile:
    outfile.write(json_object)
