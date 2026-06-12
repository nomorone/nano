const axios = require('axios');

async function igstalk(Username) {
  const username = String(Username || '').replace(/^@/, '').trim()
  if (!username) throw new Error('Username Instagram kosong')

  try {
    const { data } = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
      timeout: 20000,
      validateStatus: status => status >= 200 && status < 500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'application/json',
        'x-ig-app-id': '936619743392459'
      }
    })

    console.log('Response status:', data ? 'Received data' : 'No data');
    const user = data?.data?.user
    if (!user) {
        console.log('Full response:', JSON.stringify(data, null, 2));
        throw new Error(data?.message || 'Data Instagram tidak ditemukan')
    }

    const formatCount = value => typeof value === 'number'
      ? new Intl.NumberFormat('id-ID').format(value)
      : value || '0'

    return {
      id: user.id || '',
      profile: user.profile_pic_url_hd || user.profile_pic_url,
      fullname: user.full_name || '-',
      username: user.username || username,
      post: formatCount(user.edge_owner_to_timeline_media?.count),
      followers: formatCount(user.edge_followed_by?.count),
      following: formatCount(user.edge_follow?.count),
      bio: user.biography || '-',
      verified: user.is_verified ? 'Yes' : 'No',
      private: user.is_private ? 'Yes' : 'No'
    }
  } catch (error) {
    console.error('Error in igstalk:', error.message);
    if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

igstalk('instagram').then(console.log).catch(err => console.error('Test failed'));
