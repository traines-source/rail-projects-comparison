# European Rail Projects Comparison

This repository collects data like track length, tunnel length, passenger numbers, CO2 emissions and more about selected recent railway projects and presents it as an interactive scatter plot.

See it online at https://comparail.traines.eu

See the source data files in the [data/](https://github.com/traines-source/rail-projects-comparison/tree/master/data/) directory or download the aggregated data as [CSV](https://comparail.traines.eu/dist/rail-projects-comparison.csv). The data is licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## Contribute

If you think a project (also from other parts of Europe!) is missing, you find an error or you want to propose additional metrics, please open an issue or a pull request. It's always good to have more data!

In order to add metadata for a project, you can basically just add a new YAML file to the [data/](https://github.com/traines-source/rail-projects-comparison/tree/master/data/) directory and use the existing YAML project files as a guide. Please always give sources. For the individual metrics/dimensions, explanations can be found on the generated [website](https://comparail.traines.eu/) (and of course also in the [source translation files](https://github.com/traines-source/rail-projects-comparison/blob/master/locale/en/LC_MESSAGES/messages.po)). Some further hints are also given in the [_dimensions.yaml](https://github.com/traines-source/rail-projects-comparison/tree/master/data/_dimensions.yaml) file. The `paths` definition is used for rendering the small line diagram of the project, using [transport-network-animator](https://github.com/traines-source/transport-network-animator) syntax.

If you have any issues creating the YAML file, you can always make a draft pull request and we can work on it together, or, even easier, just create a GitHub issue containing the data you have researched, without worrying about YAML files.

If you want to preview your changes (you don't have to), you can build the website in one of the following three ways:

* build and run the Docker image using the `Dockerfile`, however you do that on your platform (easiest)
* run `bash generate/generate_docker.sh` (Docker required, shell script can probably be adapted to Windows) and then serve the root directory of the repository with a webserver of your choice 
* run `bash generate/generate.sh` (no Docker, but all the dependencies required, probably Linux only) and then serve the root directory of the repository with a webserver of your choice

## CO2 Emissions Estimation

For all projects, reference construction emissions and emission savings per year when operational are given based on official sources or project-specific best-effort estimates. The calculation methods vary significantly between projects. Furthermore, in order to enable better comparison between the projects, high and low estimates are provided that are calculated using a simple formula based on key metrics of the project. The formulas were conceived to provide an upper and lower bound for most of the reference estimates.

Construction emissions:

```
length_double_track*construction_emission_per_km_double_track*(maximum_speed/160)^2
    + length_tunnel_tube*construction_emission_per_km_tunnel_tube
    + length_bridge*construction_emission_per_km_bridge
    + number_stations*construction_emission_per_station
```

(Assumption: Emissions for track construction and landscaping grow quadratically with the design speed.)

Emission savings per year:

```
pkm_per_day*365*modal_shift/100/avg_people_per_car*car_emission_per_km
    + freight_transported_per_day*365*modal_shift/100*avg_distance_rail_freight_transport*truck_freight_emission_per_tkm
```

(Assumption: Non-car emissions (also emissions for running the project itself) are at least an order of magnitude lower or can be modeled by adjusting the project-specific `modal_shift` values.)

To obtain high and low estimates, high and low standard values are taken into account as detailed in the [supplementary data](https://github.com/traines-source/rail-projects-comparison/tree/master/data/_supplements.yaml).

