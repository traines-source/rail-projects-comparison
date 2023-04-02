# European Rail Projects Comparison

This repository collects data like track length, tunnel length, passenger numbers, CO2 emissions and more about selected recent railway projects and presents it as an interactive scatter plot.

See it online at https://comparail.traines.eu

See the source data files in the [data/](https://github.com/traines-source/rail-projects-comparison/tree/master/data/) directory or download the aggregated data as [CSV](https://comparail.traines.eu/dist/rail-projects-comparison.csv). The data is licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## Contribute

If you think a project (also from other parts of Europe!) is missing, you find an error or you want to propose additional metrics, please open an issue or a pull request. It's always good to have more data!

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
```

(Assumption: Non-car emissions (also emissions for running the project itself) are at least an order of magnitude lower or can be modeled by adjusting the project-specific `modal_shift` values.)

To obtain high and low estimates, high and low standard values are taken into account as detailed in the [supplementary data](https://github.com/traines-source/rail-projects-comparison/tree/master/data/_supplements.yaml).

