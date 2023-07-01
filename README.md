# Txoco Cal Padr�

## Description

TxocoCalPadri is a smart contract written in Solidity for the Ethereum Virtual Machine (EVM). It allows our gastronomic association to manage proposals and voting through the use of NFT tokens. Members of the association own an NFT which grants them the ability to vote on proposals. NFTs are managed by administrators and are not transferable by the token holders.


## Features

- Issuance and revocation of NFTs for members.
- NFTs are non-transferable by members, only by administrators, as membership is not transferable.
- Creation and management of proposals with voting options.
- Members can vote on active proposals.

## Functions

##### `setAdministrator(address _admin, bool _status)`

Allows the contract owner to add or remove administrators. Set `_status` to true to add, and false to remove.

##### `mintNFT(address _to)`

Allows administrators to mint an NFT to a specific address, granting them membership.

##### `revokeNFT(address _from)`

Allows administrators to revoke an NFT from a specific address, revoking their membership.

##### `createProposal(string memory _title, string memory _description, string[] memory _options, uint256 _startTime, uint256 _endTime)`

Allows administrators to create a new proposal with a title, description, array of voting options, and a time window for voting.

##### `closeProposal(uint256 _proposalId)`

Allows administrators to officially close a proposal after its end time has passed.

##### `vote(uint256 _proposalId, uint256 _selectedOption)`

Allows NFT holders to cast a vote on an active proposal by selecting an option.

##### `getOptionVoteCounts(uint256 _proposalId)`

Returns an array of vote counts for each option of a specific proposal.

##### `getWinningOption(uint256 _proposalId)`

Returns the index, name, and vote count of the winning option for a specific proposal.

## Events

- `ProposalCreated`
- `Voted`
- `NFTMinted`

## Testing

1. Clone this repository.
2. Navigate to the project folder and run `docker-compose build --no-cache`.
3. Run the containers using `docker-compose up -d`.
4. Compile and run tests using the following command: `docker-compose run txoco truffle test`.

#### Expected result:
![Resultado de los tests](https://oscarpascual.com/test-results-txococalpadri.jpg)

## License

MIT