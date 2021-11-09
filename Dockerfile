FROM node:16.13-alpine3.11

WORKDIR /app
RUN npm install -g nodemon

ADD package.json package-lock.json ./
RUN npm install

ENV NODE_ENV=development

ADD bin ./bin

# VOLUME [ "/app/src" ]

CMD ["nodemon"]