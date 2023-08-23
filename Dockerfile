FROM node:16

WORKDIR /app

COPY package.json ./

# Install Truffle globally
RUN npm install -g truffle

# Install Truffle tools
RUN npm install @truffle/hdwallet-provider truffle-plugin-verify

RUN npm install @openzeppelin/contracts
RUN npm install chai truffle-assertions
RUN npm install dotenv

# Install dependencies
ARG CACHE_INVALIDATE=1
RUN npm install

COPY . .

CMD ["truffle", "test"]