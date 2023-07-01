FROM node:14

WORKDIR /app

COPY package*.json ./

# Install Truffle globally
RUN npm install -g truffle

# Install dependencies
ARG CACHE_INVALIDATE=1
RUN npm install

COPY . .

CMD ["truffle", "test"]