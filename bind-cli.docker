FROM alpine AS node
RUN echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories
RUN apk add --no-cache \
	nodejs \
	nodejs-npm \
	&& npm install npm@latest --global \
	&& npm cache clean --force

FROM node
EXPOSE 53/udp
RUN apk add --no-cache \
	bind \
	bind-tools \
	&& npm install bind-cli --global \
	&& chown -R root:root /var
ADD ["./layout.tar.gz", "/"]
RUN chown -R root:root /var/bind
ENTRYPOINT ["/root/entrypoint.sh"]
