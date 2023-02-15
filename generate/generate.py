import yaml
import os
import json

datafiles = os.scandir('./data/')

data = {'projects':{}, 'dimensions':{}}

def load_yaml(s):
    with open(file, 'r') as stream:
        try:
            properties = yaml.safe_load(stream)
            for p in properties:
                if 'val' in properties[p] and type(properties[p]['val']) == str:
                    properties[p]['val'] = eval(properties[p]['val'])
            return properties
        except yaml.YAMLError as exc:
            print(exc)
 
for file in datafiles:
    if file.is_file():       
        if file.name == '_dimensions.yaml':
            data['dimensions'] = load_yaml(file)
        else:
            data['projects'][file.name.split('.')[0]] = load_yaml(file)


json_object = json.dumps(data)
with open('./dist/data.json', 'w') as outfile:
    outfile.write(json_object)
