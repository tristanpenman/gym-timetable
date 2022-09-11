exports.handler = async (event) => {
  const flindersStId = 'e3260b8a-b5e7-4042-bc2a-8a2fa171d27d';
  const melbCentralId = '45b4263e-7633-4578-9934-1f765c1723ad';
  const qvId = 'c26461ee-653d-4c70-9791-ad4f1ba2820b';
  const richmondId = 'a0412fa0-0591-4e5c-b7a4-0b1626ad96fd';
  const vicGardensId = 'ea71b228-edac-4968-93f0-f7e43d41f1bd';

  const clubId = event.queryStringParameters?.club_id || melbCentralId;

  const { default: fetch } = await import('node-fetch');

  const today = new Date();

  const plusNDays = (d, n) => {
    const e = new Date(d);
    e.setDate(e.getDate() + n);
    return e;
  };

  const datestamp = (d) => {
    return `${d.getFullYear()}-${`0${d.getMonth() + 1}`.slice(-2)}-${`0${d.getDate()}`.slice(-2)}`;
  };

  const timestamp = (d, t) => {
    const ts = `${datestamp(d)}T${t}`;
    return ts;
  };

  const options = {
    mode: 'no-cors'
  };
  
  const params = {
    FromDate: timestamp(today, '00:00:00'),
    ToDate: timestamp(plusNDays(today, 6), '23:59:59'),
    ClubIds: [clubId]
  };
  
  const url = `https://api.fitnessfirst.com.au/classes/v1/api/sessions?${new URLSearchParams(params).toString()}`;
  const result = await fetch(url, options);
  const data = await result.json();
  const sessions = data.sessions;
  const sorted = sessions.sort((a, b) => new Date(a.startDate) < new Date(b.startDate));
  const clubName = sessions.find((session) => session.clubId === clubId)?.clubName || 'Unknown';
  
  const bucketed = [];
  sorted.forEach((session) => {
    const date = datestamp(new Date(session.startDate));
    if (bucketed.length === 0 || bucketed[bucketed.length - 1].date !== date) {
      bucketed.push({
        date,
        sessions: []
      });
    }

    bucketed[bucketed.length - 1].sessions.push(session);
  });
  
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Group Fitness Timetable</title>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700');

    *, *:before, *:after {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Source Sans Pro', sans-serif;
      margin: 0;
      padding: 24px;
      text-align: left;
    }
    
    td {
      padding-right: 15px;
    }

    h1,h2,h3,h4,h5,h6 {
      margin: 0;
    }
    
    a {
      background: #f5f5f5;
      border-radius: 5px;
      border: 1px solid #ccc;
      color: black;
      display: inline-flex;
      margin: 5px 5px 5px 0;
      padding: 10px;
      text-decoration: none;
    }
    
    a:hover {
      background: #f9f9f9;
    }
  </style>
</head>
<body>
  <h1>Group Fitness Timetable</h1>
  <h2>${clubName}</h2>
  <hr>
  <a href="?club_id=${flindersStId}">Flinders Street</a>
  <a href="?club_id=${melbCentralId}">Melbourne Central</a>
  <a href="?club_id=${qvId}">QV Platinum</a>
  <a href="?club_id=${richmondId}">Richmond</a>
  <a href="?club_id=${vicGardensId}">Vic Gardens</a>
  <hr>
  <table>
  <tbody>
    ${bucketed.map((bucket) => `
    <tr>
      <th colspan="3">${bucket.date} - ${dayNames[new Date(bucket.date).getDay()]}</th>
    </tr>
    <tr>
      <th>
        Time
      </th>
      <th>
        Class
      </th>
      <th>
        Instructor
      </th>
    </tr>
    ${bucket.sessions.map((session) => `
    <tr>
      <td>
        ${`0${new Date(session.startDate).getHours()}`.slice(-2)}:${`0${new Date(session.startDate).getMinutes()}`.slice(-2)}
      </td>
      <td>
        ${session.className}
      </td>
      <td>
        ${session.instructorName}
      </td>
    </tr>
    `).join('')}
    <tr>
      <th colspan="3">&nbsp;</th>
    </tr>
  `).join('')}
  </tbody>
  </table>
</body>
</html>
`;

  const response = {
    body,
    headers: {
      'content-type': 'text/html'
    },
    statusCode: 200
  };

  return response;
};
