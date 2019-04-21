FROM node:8.11.3
RUN mkdir -p /usr/src/seocraft-api
WORKDIR /usr/src/seocraft-api
COPY ./ ./
RUN npm install
CMD ["node", "index.js"]
