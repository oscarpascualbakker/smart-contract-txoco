// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract TxocoCalPadri is ERC1155 {

    // Variables 'name', 'symbol' and 'collectionName', which are not used throughout the entire contract,
    // are used by some wallets to name the collections.
    string public constant name = "Txoco Cal Padri";
    string public constant symbol = "TCP";
    string public collectionName = "Txoco Cal Padri";

    address public immutable owner;

    mapping(address => bool) public administrators;

    struct Proposal {
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256[] optionVoteCounts;         // Additional array to keep a count of votes per option
        mapping(address => uint256) votes;  // Maps voter's address to selected option index
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount = 0;
    uint256 public activeProposalCount = 0;
    string public baseURI;

    event ProposalCreated(uint256 proposalId, string title, uint256 startTime, uint256 endTime);
    event Voted(uint256 proposalId, address voter, uint256 selectedOption);
    event NFTMinted(address to);


    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    modifier onlyAdministrator() {
        require(administrators[msg.sender], "You are not an administrator");
        _;
    }


    /**
     * @notice Initializes the contract and sets the base URI for tokens.
     */
    constructor() ERC1155("") {
        owner = msg.sender;
        administrators[msg.sender] = true; // The contract deployer is the first administrator
        baseURI = "https://oscarpascual.com/txococalpadri/metadata.json";
        _setURI(baseURI);
    }


    /**
     * @notice Allows the owner to set the base URI.
     * @param _baseURI The new base URI to be set.
     */
    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
        _setURI(_baseURI);
    }


    /**
     * @notice Overrides the uri function from ERC1155 to return the base URI for all tokens.
     * @param tokenId The ID of the token.
     * @return The base URI string.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        // Ignore tokenId, as it is not needed in this contract
        return baseURI;
    }


    /**
     * @notice Set or unset an address as an administrator.
     * @param _admin The address to be set or unset as administrator.
     * @param _status The status to set, true for set and false for unset.
     */
    function setAdministrator(address _admin, bool _status) external onlyOwner {
        administrators[_admin] = _status;
    }


    /**
     * @notice Mints a new NFT to the specified address.  Members can only have one.
     * @param _to The address to mint the NFT to.
     */
    function mintNFT(address _to) external onlyAdministrator {
        require(balanceOf(_to, 0) == 0, "Address already owns the NFT");

        emit NFTMinted(_to);

        _mint(_to, 0, 1, "");
    }


    /**
     * @notice Burns the NFT from the specified address.  Non-members can't hold the NFT.
     * @param _from The address to burn the NFT from.
     */
    function revokeNFT(address _from) external onlyAdministrator {
        require(balanceOf(_from, 0) > 0, "Address does not own the NFT");
        _burn(_from, 0, 1);
    }


    /**
     * @notice Allows any member of the DAO to create a new proposal.
     * @param _title The title of the proposal.
     * @param _description The description of the proposal.
     * @param _options The options for the proposal.
     * @param _startTime The start time of the proposal.
     * @param _endTime The end time of the proposal.
     */
    function createProposal(string memory _title, string memory _description, string[] memory _options, uint256 _startTime, uint256 _endTime) external {
        require(balanceOf(msg.sender, 0) > 0, "Must be a member to create a proposal");
        require(_endTime > _startTime, "End time must be after start time");

        proposals[proposalCount].title = _title;
        proposals[proposalCount].description = _description;
        proposals[proposalCount].options = _options;
        proposals[proposalCount].startTime = _startTime;
        proposals[proposalCount].endTime = _endTime;
        proposals[proposalCount].active = true;
        proposals[proposalCount].optionVoteCounts = new uint256[](_options.length);

        emit ProposalCreated(proposalCount, _title, _startTime, _endTime);

        proposalCount++;
        activeProposalCount++;
    }


    /**
     * @notice Allows an administrator to close a proposal.
     * @param _proposalId The ID of the proposal to be closed.
     */
    function closeProposal(uint256 _proposalId) external onlyAdministrator {
        require(_proposalId < proposalCount, "Proposal does not exist");
        require(proposals[_proposalId].active, "Proposal is already closed");
        require(block.timestamp > proposals[_proposalId].endTime, "Proposal has not yet ended");

        proposals[_proposalId].active = false;
        activeProposalCount = activeProposalCount > 0 ? activeProposalCount - 1 : 0;
    }


    /**
     * @notice Allows a member to vote on a proposal.
     * @param _proposalId The ID of the proposal to vote on.
     * @param _selectedOption The index of the selected option.
     */
    function vote(uint256 _proposalId, uint256 _selectedOption) external {
        require(balanceOf(msg.sender, 0) > 0, "Must be a member to vote");
        require(proposals[_proposalId].active, "Proposal is not active");
        require(block.timestamp >= proposals[_proposalId].startTime, "Voting has not started");
        require(proposals[_proposalId].votes[msg.sender] == 0, "You have already voted on this proposal");
        require(_selectedOption < proposals[_proposalId].options.length, "Invalid option selected");

        if (block.timestamp > proposals[_proposalId].endTime) {
            proposals[_proposalId].active = false;
            activeProposalCount = activeProposalCount > 0 ? activeProposalCount - 1 : 0;
        }

        // Increment the vote count for the selected option
        proposals[_proposalId].optionVoteCounts[_selectedOption]++;

        // Register the vote in the mapping
        proposals[_proposalId].votes[msg.sender] = _selectedOption + 1;

        emit Voted(_proposalId, msg.sender, _selectedOption);
    }


    /**
     * @notice Get the vote counts for each option in a proposal.
     * @param _proposalId The ID of the proposal.
     * @return An array containing the vote counts for each option.
     */
    function getOptionVoteCounts(uint256 _proposalId) external view returns (uint256[] memory) {
        return proposals[_proposalId].optionVoteCounts;
    }


    /**
     * @notice Get the winning option for a proposal.
     * @param _proposalId The ID of the proposal.
     * @return winningOption The index of the winning option.
     * @return optionName The name of the winning option.
     * @return voteCount The vote count of the winning option.
     */
    function getWinningOption(uint256 _proposalId) external view returns (uint256 winningOption, string memory optionName, uint256 voteCount) {
        uint256[] memory counts = proposals[_proposalId].optionVoteCounts;
        uint256 maxVotes = 0;

        for (uint256 i = 0; i < counts.length; i++) {
            if (counts[i] > maxVotes) {
                maxVotes = counts[i];
                winningOption = i;
            }
        }

        optionName = proposals[_proposalId].options[winningOption];
        voteCount = maxVotes;

        return (winningOption, optionName, voteCount);
    }


    /**
     * @notice Overrides safeTransferFrom function to only allow administrators to transfer tokens.
     */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes memory _data) public override {
        require(administrators[msg.sender] || msg.sender == address(this), "Only administrators can transfer tokens");
        super.safeTransferFrom(_from, _to, _id, _value, _data);
    }


    /**
     * @notice Overrides safeBatchTransferFrom function to only allow administrators to transfer tokens.
     */
    function safeBatchTransferFrom(address _from, address _to, uint256[] memory _ids, uint256[] memory _values, bytes memory _data) public override {
        require(administrators[msg.sender] || msg.sender == address(this), "Only administrators can transfer tokens");
        super.safeBatchTransferFrom(_from, _to, _ids, _values, _data);
    }

}
