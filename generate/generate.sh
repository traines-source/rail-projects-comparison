docker run --rm -it -v $(pwd):/app --workdir /app $(docker build -q ./generate/) python ./generate/generate.py