FROM node:18-bullseye-slim

WORKDIR /app 
# Build arguments for environment variables
ARG GROQ_API_KEY
ARG LICHESS_API_TOKEN
# Create .env file from build arguments
RUN if [ -n "$GROQ_API_KEY" ]; then \
    echo "GROQ_API_KEY=${GROQ_API_KEY}" > .env; \
    echo "LICHESS_API_TOKEN=${LICHESS_API_TOKEN}" >> .env; \ 
    fi
RUN apt-get update && apt-get install -y stockfish && rm -rf /var/lib/apt/lists/*
COPY . .

RUN npm install 

EXPOSE 5000

CMD ["npm", "start"] 