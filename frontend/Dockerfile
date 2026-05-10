FROM node:18-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

EXPOSE 3001

ENV NEXT_PUBLIC_API_URL=http://localhost:3000/api

CMD ["npm", "run", "dev", "--", "-p", "3001"]