// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FileNFT is ERC721, Ownable {
    uint256 private _tokenIds;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("FileNFT", "FILE") Ownable(msg.sender) {}

    function mintNFT(address recipient, string memory uri) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _mint(recipient, newItemId);
        _tokenURIs[newItemId] = uri;
        return newItemId;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string(abi.encodePacked(base, _tokenURI)) : _tokenURI;
    }
} 