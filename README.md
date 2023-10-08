# Txoco Cal Padrí

## Description

TxocoCalPadri is a smart contract written in Solidity for the Ethereum Virtual Machine (EVM). It allows our gastronomic association to manage proposals and voting through the use of NFT tokens. Members of the association own an NFT which grants them the ability to vote on proposals. NFTs are managed by administrators and are non-transferable by token holders.

![Solidity 0.8.18](https://img.shields.io/badge/Solidity-0.8.18-blue) ![Truffle 5.11.4](https://img.shields.io/badge/Truffle-5.11.4-blue) ![Ganache 7.9.1](https://img.shields.io/badge/Ganache-7.9.1-blue) ![Node 16.20.2](https://img.shields.io/badge/Node-16.20.2-blue) ![Slither 0.9.6](https://img.shields.io/badge/Slither-0.9.6-blue)

## Features

- Issuance and revocation of NFTs for members
- NFTs are non-transferable by members, only administrators can transfer them as membership is non-transferable
- Creation and management of proposals with voting options
- Members can vote on active proposals

## Functions

##### `setBaseURI(string memory _baseURI)`

Allows the contract owner to set the base URI for token metadata.

##### `setAdministrator(address _admin, bool _status)`

Allows the contract owner to add or remove administrators. Set `_status` to true to add, false to remove.

##### `mintNFT(address _to, uint256 _tokenId)`

Allows administrators to mint an NFT to a specific address, granting membership.

##### `revokeNFT(address _from, uint256 _tokenId)`

Allows administrators to revoke an NFT from a specific address, revoking membership.

##### `createProposal(string memory _title, string memory _description, string[] memory _options, uint256 _startTime, uint256 _endTime)`

Allows administrators to create a new proposal with title, description, array of voting options, and a time window for voting.

##### `closeProposal(uint256 _proposalId)`

Allows administrators to officially close a proposal after its end time has passed.

##### `vote(uint256 _proposalId, uint256 _selectedOption)`

Allows NFT holders to cast a vote on an active proposal by selecting an option.

##### `getOptionVoteCounts(uint256 _proposalId)`

Returns an array of vote counts for each option of a specific proposal.

##### `getWinningOption(uint256 _proposalId)`

Returns index, name, and vote count of winning option for a specific proposal.

## Events

- `ProposalCreated`: Emitted when a new proposal is created.
- `Voted`: Emitted when a vote is cast on a proposal.
- `NFTMinted`: Emitted when a new NFT is minted.

## Overridden Functions

This contract overrides the following functions from its inherited contracts to adapt their behavior for the specific requirements of this contract:

##### `uri(uint256 tokenId) -> string`

Overrides the uri function from the ERC1155 contract. Used to get a token's metadata URI. However, this ignores the tokenId and returns the base URI for all tokens.

##### `safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes memory _data)`

Overrides safeTransferFrom function from ERC1155 contract. Used to safely transfer tokens between addresses. Modified to only allow administrators to transfer tokens.

##### `safeBatchTransferFrom(address _from, address _to, uint256[] memory _ids, uint256[] memory _values, bytes memory _data)`

Overrides safeBatchTransferFrom from ERC1155 contract. Used to perform batch transfer of multiple tokens between addresses. Modified to only allow administrators to transfer tokens.

## Testing

1. Clone this repository
2. Navigate to project folder and run `docker-compose build --no-cache`
3. Start containers with `docker-compose up -d`
4. Compile and run tests with `docker-compose run --rm txoco truffle test`
5. Run static code analysis with `docker-compose run --rm slither slither . --exclude-dependencies`

#### Expected test result:

![Test results image](https://oscarpascual.com/txococalpadri/results-tests.jpg)

#### Expected code analysis result

![Code analysis result](https://oscarpascual.com/txococalpadri/results-slither.jpg)


## License

MIT