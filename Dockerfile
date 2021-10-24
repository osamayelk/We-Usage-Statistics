FROM node:14-alpine
COPY package*.json /server/
WORKDIR /server
RUN npm install
COPY . /server/
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/node", "/server/index.js"]