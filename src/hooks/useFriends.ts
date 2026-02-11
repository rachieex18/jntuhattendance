import { useState } from 'react';

// Demo mode - friends functionality disabled
export const useFriends = () => {
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    return {
        friends,
        requests,
        loading,
        sendFriendRequest: () => Promise.resolve(),
        acceptFriendRequest: () => Promise.resolve(),
        rejectFriendRequest: () => Promise.resolve(),
        searchUsers: () => Promise.resolve([]),
    };
};