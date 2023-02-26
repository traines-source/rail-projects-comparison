FROM python:3 AS buildenv

RUN pip install --no-input pyyaml babel jinja2

FROM buildenv AS builder

COPY . /tmp/working/
RUN cd /tmp/working/ && bash ./generate/generate.sh && bash ./generate/download.sh

FROM nginx

COPY --from=builder /tmp/working/dist/ /usr/share/nginx/html/dist/
COPY --from=builder /tmp/working/dist/www/ /usr/share/nginx/html/

RUN rm -r /usr/share/nginx/html/dist/www/

COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

COPY res/ /usr/share/nginx/html/res/
COPY vendor/ /usr/share/nginx/html/vendor/