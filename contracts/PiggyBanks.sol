pragma solidity ^0.5.12;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721Receiver.sol";

contract Ownable {
    address payable public owner;
    
    constructor (address payable _owner) internal {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    event Transferred();

    function transfer(address payable _owner) external onlyOwner {
        require(_owner != address(0));
        owner = _owner;
        emit Transferred();
    }
}

contract PiggyBank is Ownable, IERC721Receiver {
    
    bytes32 public name;
    
    constructor (address payable _owner, bytes32 _name) public Ownable(_owner) {
        name = _name;
    }
    
    event Received();

    function () external payable{
        emit Received();
    }
    
    event Renamed();
    
    function rename(bytes32 _name) external onlyOwner {
        name = _name;
        emit Renamed();
    }

    event Freed();
    
    function free() external onlyOwner {
        emit Freed();
        withdrawTokens();
        withdrawCollectibles();
        selfdestruct(owner);
    }
    
    address[] public tokens;
    
    function tokensCount() external view returns (uint) {
        return tokens.length;
    }

    function addToken(address token) external {
        tokens.push(token);
    }
    
    function onERC20Received(address, uint256) public returns(bytes4){
        tokens.push(msg.sender);
        return this.onERC20Received.selector;
    }
    
    function withdrawTokens() internal {
        for (uint i = 0; i < tokens.length; i++){
            IERC20 token = IERC20(tokens[i]);
            uint256 balance = token.balanceOf(address(this));
            if (balance == 0) continue;
            token.transfer(owner, balance);
        }
    }
    
    address[] public collectibles;
    mapping(address => uint256[]) public collected; 
    
    function collectiblesCount() external view returns (uint) {
        return collectibles.length;
    }
    
    function collectedCount(address collectible) external view returns (uint) {
        return collected[collectible].length;
    }
    
    function onERC721Received(address, address, uint256 tokenId, bytes memory) public returns (bytes4){
        if(collected[msg.sender].length == 0){
            collectibles.push(msg.sender);
        }
        collected[msg.sender].push(tokenId);
        return this.onERC721Received.selector;
    }
    
    function withdrawCollectibles() internal {
        for (uint i = 0; i < collectibles.length; i++){
            address addr = collectibles[i];
            IERC721 collectible = IERC721(addr);
            uint256[] storage tokenIds = collected[addr];
            for(uint j = 0; j < tokenIds.length; j++){
                collectible.transferFrom(address(this), owner, tokenIds[j]);
            }
        }
    }
}

contract Payable is Ownable(msg.sender) {

    uint public price = 1 finney;
    
    function setPrice(uint _price) external onlyOwner {
        price = _price;
    }
    
    function withdraw() external onlyOwner {
        owner.transfer(address(this).balance);
    }
}

contract PiggyBanks is Payable {
    
    event Created(address piggyBank);
     
    function create(bytes32 _name) external payable returns (address) {
        require(msg.value >= price);
        PiggyBank bank = new PiggyBank(msg.sender, _name);
        owner.transfer(msg.value);
        emit Created(address(bank));
        return address(bank);
    }
}