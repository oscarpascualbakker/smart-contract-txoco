FROM node:16

WORKDIR /app

COPY package.json ./

# Install Truffle globally
RUN npm install -g truffle

# Install Truffle tools, OpenZeppelin contracts and other needed stuff
RUN npm install @truffle/hdwallet-provider truffle-plugin-verify truffle-assertions
RUN npm install @openzeppelin/contracts
RUN npm install chai dotenv web3

# Install dependencies
ARG CACHE_INVALIDATE=1
RUN npm install

COPY . .

CMD ["truffle", "test"]