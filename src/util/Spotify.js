//method getAccessToken in the Spotify module. The method will get a user's access token so that they can make requests to the Spotify API. Use the Spotify Applications Registration Flow and Spotify Authentication guide to help you write the method.
let accessToken = '';
const clientId = 'b137785fd06e4098a8bd72391cc16650';
const redirectUri = 'http://localhost:3000/'; //'http://nifty-push.surge.sh/';
const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/'); // This clears the parameters, allowing us to grab a new access token when it expires.
      return accessToken;
    } else {
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
      window.location = accessUrl;
    }
  },
  search: function(searchTerm) {
    const accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${searchTerm}`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return [];
      }
      return jsonResponse.tracks.items.map(track => {
        return {
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }
      });
    });
  },
  savePlaylist(playlistName, playlistTrackUris) {
    if (playlistName && playlistName) {
      const userAccessToken = accessToken;
      const headers = {
        'Authorization': 'Bearer ' + userAccessToken,
        'Content-type': 'application/json'
      };
      let userID = '';
      let playlistID = '';
      return fetch(`https://api.spotify.com/v1/me`, {
        headers: headers
      }).then(response => {
        return response.json();
      }).then(jsonResponse => {
        userID = !jsonResponse.id ? '' : jsonResponse.id;
        return userID;
      }).then(userID => {
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({name: playlistName})
        }).then(response => {
          return response.json();
        }).then(jsonResponse => {
          playlistID = !jsonResponse.id ? '' : jsonResponse.id;
          return playlistID;
        }).then(playlistID => {
          return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({uris: playlistTrackUris})
          }).then(response => {
            return response.json();
          }).then(jsonResponse => {
            if (!jsonResponse.id) {
              return '';
            }
            return jsonResponse.id;
          });
        });
      });
    } else {
      return;
    }
  }
};

export default Spotify;
