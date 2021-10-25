FROM node:14-alpine
COPY package*.json /server/
WORKDIR /server
RUN npm install
COPY . /server/
ENV AES_KEY=${AES_KEY}
ENV AES_IV=${AES_IV}
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/node", "/server/index.js"]