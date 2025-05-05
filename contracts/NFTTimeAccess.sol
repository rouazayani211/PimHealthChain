// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTTimeAccess is Ownable {
    struct AccessGrant {
        address user;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    // NFT contract address => token ID => user address => access grant
    mapping(address => mapping(uint256 => mapping(address => AccessGrant))) public accessGrants;
    
    // Events
    event AccessGranted(address indexed nftContract, uint256 indexed tokenId, address indexed user, uint256 startTime, uint256 endTime);
    event AccessRevoked(address indexed nftContract, uint256 indexed tokenId, address indexed user);
    event AccessUsed(address indexed nftContract, uint256 indexed tokenId, address indexed user);

    // Constructor with initial owner
    constructor(address initialOwner) Ownable(initialOwner) {}

    // Grant temporary access to an NFT
    function grantAccess(
        address nftContract,
        uint256 tokenId,
        address user,
        uint256 durationInSeconds
    ) external {
        require(user != address(0), "Invalid user address");
        require(durationInSeconds > 0, "Duration must be positive");
        
        // Check if the sender is the owner of the NFT
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the NFT owner");

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + durationInSeconds;

        AccessGrant storage grant = accessGrants[nftContract][tokenId][user];
        grant.user = user;
        grant.startTime = startTime;
        grant.endTime = endTime;
        grant.isActive = true;

        emit AccessGranted(nftContract, tokenId, user, startTime, endTime);
    }

    // Revoke access before the end time
    function revokeAccess(
        address nftContract,
        uint256 tokenId,
        address user
    ) external {
        require(msg.sender == IERC721(nftContract).ownerOf(tokenId), "Not the NFT owner");
        
        AccessGrant storage grant = accessGrants[nftContract][tokenId][user];
        require(grant.isActive, "No active access grant");
        
        grant.isActive = false;
        emit AccessRevoked(nftContract, tokenId, user);
    }

    // Check if a user has active access to an NFT
    function hasAccess(
        address nftContract,
        uint256 tokenId,
        address user
    ) public view returns (bool) {
        AccessGrant memory grant = accessGrants[nftContract][tokenId][user];
        return grant.isActive &&
               block.timestamp >= grant.startTime &&
               block.timestamp <= grant.endTime;
    }

    // Use access (can be called by authorized contracts)
    function useAccess(
        address nftContract,
        uint256 tokenId,
        address user
    ) external returns (bool) {
        require(hasAccess(nftContract, tokenId, user), "No valid access");
        emit AccessUsed(nftContract, tokenId, user);
        return true;
    }

    // Get access grant details
    function getAccessGrant(
        address nftContract,
        uint256 tokenId,
        address user
    ) external view returns (
        uint256 startTime,
        uint256 endTime,
        bool isActive
    ) {
        AccessGrant memory grant = accessGrants[nftContract][tokenId][user];
        return (grant.startTime, grant.endTime, grant.isActive);
    }
} 