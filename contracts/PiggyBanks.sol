pragma solidity ^0.5.13;

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

    event Transferred(address old, address owner);

    function transfer(address payable _owner) external onlyOwner {
        require(_owner != address(0));
        address old = owner;
        owner = _owner;
        emit Transferred(old, _owner);
    }
}

contract PiggyBank is Ownable, IERC721Receiver {
    
    bytes32 public name;
    
    constructor (address payable _owner, bytes32 _name) public Ownable(_owner) {
        name = _name;
    }
    
    event Received(address sender, uint value);

    function () external payable{
        emit Received(msg.sender, msg.value);
    }
    
    event Renamed(bytes32 old, bytes32 name);
    
    function rename(bytes32 _name) external onlyOwner {
        bytes32 old = name;
        name = _name;
        emit Renamed(old, _name);
    }

    event Freed();
    
    function free() external onlyOwner {
        emit Freed();
        withdrawTokens();
        withdrawCollectibles();
        selfdestruct(owner);
    }
    
    event TokenAdded(address token);
    address[] public tokens;
    
    function tokensCount() external view returns (uint) {
        return tokens.length;
    }

    function addToken(address token) external onlyOwner {
        tokens.push(token);
        emit TokenAdded(token);
    }
    
    function onERC20Received(address, uint256) public returns(bytes4){
        tokens.push(msg.sender);
        emit TokenAdded(msg.sender);
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
    
    event CollectibleAdded(address token, uint256 id);
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
        emit CollectibleAdded(msg.sender, tokenId);
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
    
    event Created(address piggyBank, address creator);
     
    function create(bytes32 _name) external payable returns (address) {
        require(msg.value >= price);
        address payable piggyBank = address(new PiggyBank(msg.sender, _name));
        owner.transfer(msg.value);
        emit Created(piggyBank, msg.sender);
        return piggyBank;
    }
}