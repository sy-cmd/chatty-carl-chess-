FROM node:18-bullseye-slim

WORKDIR /app 
RUN apt-get update && apt-get install -y stockfish && rm -rf /var/lib/apt/lists/*
COPY . .

RUN npm install 

EXPOSE 5000

CMD ["npm", "start"] 