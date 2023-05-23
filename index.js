exports.handler = async (event) => {
  const flindersStId = 'e3260b8a-b5e7-4042-bc2a-8a2fa171d27d';
  const melbCentralId = '45b4263e-7633-4578-9934-1f765c1723ad';
  const qvId = 'c26461ee-653d-4c70-9791-ad4f1ba2820b';
  const richmondId = 'a0412fa0-0591-4e5c-b7a4-0b1626ad96fd';
  const stKildaId = 'fae44247-2f5c-4fc4-80e3-982b6d88646b';
  const vicGardensId = 'ea71b228-edac-4968-93f0-f7e43d41f1bd';

  const clubId = event.queryStringParameters?.club_id || melbCentralId;

  const { default: fetch } = await import('node-fetch');

  // There are probably better ways to do this using moment.js
  // but this is good enough for ensuring that the day/month that we
  // supply to the Fitness First API is in the correct timezone for
  // the current day (i.e Melbourne/Sydney)
  const now = new Date();
  const timeZone = 'Australia/Melbourne';
  const day = now.toLocaleString('en-US', { timeZone, day: 'numeric' });
  const monthIndex = now.toLocaleString('en-US', { timeZone, month: 'numeric' }) - 1;
  const year = now.toLocaleString('en-US', { timeZone, year: 'numeric' });
  const today = new Date(year, monthIndex, day);

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

  const tryFetch = async (url, options) => {
    for (let i = 0; i < 5; i++) {
      try {
        return await fetch(url, options);
      } catch (error) {
        // wait three seconds
        await new Promise((resolve) => {
          setTimeout(() => resolve, 3000);
        });
      }
    }
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
  const result = await tryFetch(url, options);
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
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💪</text></svg>">
  <title>FF Timetable</title>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700');

    *, *:before, *:after {
      box-sizing: border-box;
    }

    body {
      background: #eee;
      font-family: 'Source Sans Pro', sans-serif;
      margin: 0;
      padding: 0;
      text-align: left;
    }

    td {
      padding-right: 15px;
    }

    h1,h2,h3,h4,h5,h6 {
      margin: 0;
    }

    h2 {
      font-size: 20px;
      margin-top: 5px;
    }

    a {
      background: #f5f5f5;
      border-radius: 5px;
      color: black;
      display: inline-flex;
      margin: 15px 5px 0 0;
      padding: 10px;
      text-decoration: none;
    }

    a:hover {
      background: #f9f9f9;
    }

    .heading {
      background-color: #000;
      color: #fff;
      padding: 20px 24px;
    }

    .main {
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="heading">
    <img
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAAwCAMAAAAYYwcUAAAA21BMVEUAAAD////YGTLaGjLaGjLZGTPZGjHbGjLZGjLPEDDaGjLXGDDaGTHYGTLZGTHXGDDaGjLZGTHaFTDaGzDbGjLaGTPZGDDaGzLfIDDYGjHbGDTYFzDaGzL////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ZGTL////////////////////////////////////////cGzPaGjL///+RG02gAAAAR3RSTlMAAJDfn1DPf4AQz0C/cN8g76AwMK+/X5AQsEBPYM/fkFHeIBCA/kBPAa/uUDBgvu+/jyFBsHERn19vcN9/zp5hrjGgjl5uXxE3SH4AAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAHdElNRQfnBRIDARtkXdcKAAAGBklEQVRo3t1ai1bbRhBdOYFAbGrzKpSAjLXS2iAJyaEN2AWa0ibl/7+o+9CuZl+yMHHOseecJGjQSHt3Hnd2FNR5935rG33oILTzn0t2Efpo6rponaWH9n7pD/YQ2nfhHdA7LOXBOuM97KCj/V6HOu3YBbhH77CUa+3grT3UO/z1hDpt4AL8nt5h6rbXGvDuLurTvxE6dabwniO3f0MbIWdOwJ8cud3ZDMBbTsAHjtw+3wzAblZCjtzubgbgIxfebVdu79rGFyGU4YqXGlxqrxtFSz3lo4eVzlzUbAh+0SReNeBYe12Cl3qKM6I7jtzu2bZEBzxeMeDJlfa666Ue0n8LK6U64Kx2fZZHKwB8ob3uplVU0KVoitNuJT2jPh12DenbT+MhlhMpUp0XGvofB5g9t1Sva7Glk2nhjQQtl/vtVsBCrLDVQ7YPK0jhz68uFDwmbhbn8qDl89jjLmx16Va/GfAtq1TjV8fElfswsUzXzB73u1tdrgDwHwzwa1Il+OKPibMluuaIPW4YQcGSrO7YlSxg/J88ju9V2gUZvYxTrEoLYdc5wfDXs1RDNxlywNr7hHGUU7uA15AgApYiJuZqKVD2IOAdhM7/rKShgzZYicOn6kwr28zdCM9KrgjFi4O0qrfJg7ieFdLkMWLJWsrL0T0AXFqvY1TMyCohwW04six5THgo7MQ4OpwA8D6Z24DnGllJ9A8Kz53ZQDxJR9QQgs9hfTn2spLEwfI0IRRoQn/WLXlMeCjs2GClYwDeJ0MbMJFk9VIVLoOqQ4bvL+gjorvuUf89TNmJ/bobmadsR5PItKwfPLUW/8430GqY6/DHlVL45uKKrLg6huiLQjpduCHGwWUhlsKRfKWJRtJhXDVUI8IuY+CZ4G++Y+p9L6IA1+FxnZmWPCYKdnNqrv3UO9BawEqlTcolVItusBhSR4bC6WLhsUzKJ6FIiB66U8fRAd6mSJmruROxZTlxO9diJTjQamIoWaUM+BpZMUxFjAFbKXYRuTq1+JVHwNMCVlJGVUF4JNLyqx4TyXzxGAAOtHp+vJmsUjopY437avS42h8ed7TA4FlYuYw7q6ifFApeM5uIZ9jABXNJA1cAlW6px0TDGAAeHRpYKZVVqsYTS7Iam1qwP8zp4awsFI+hirPuYYtOfR81NXCqf4WJNdcsmzqVI4OVjgD4RlbKNFIeSzUxtWB/CoO3aQdTsUlF07L8h/cNfV1Z1XxdrVnymEjciz/2DbS6C1jJhj+U1dqIAu63SJsalHJfsGS4CmIe2myC3SVDzyBqmXDLf2RRfHQvfuAbaC1gJSPEsHmEimv0V9X+yP6MV+66TX0WSow0yGOjr8utiknM0UM+Un2H/+hwag60elJaHx1UiF2YrFTo+8NDoYytWiLiWqmjoe5Ro2SoiqAnFg+FqWjhREsyXXx06LU7OnhCTCcrgF7uD3A6wsRbBIVBbEwbsHUzzKAAWEq6y52LP19i4O4JMZ2sVP9c51rNLtFDUZqA6dIxsJ37pg2xdKyKLCpfJgGTiSCqJlY6MVipjXhCjO/DlOSlgV7lGnfJNM+HF1UVI+HVjBCSVp0YCss4pZdTI1b1vu7ZwUoBtby8vb2cCjbiLUkyz2blvJmVWg7cPSGmDoes/oCKotgqNY9X8NB1V52ywVnDXzLY7gQgg6DlCB4Ob1Yw0FK1Axfg5AQqiso1XB/hXgrWFYHhKyNiuCH3xrRBpXQg4cMMApbJv2wi4J9gLzvQKh2knAlAIWugAVXX+xPJQ1s54wtJ1SGuZI1H9iy3LEzNkqHoBydUGPyU/VAlVnZ3TS9e6J/rVJy7Ey433yTgIznW0AbQUvn9NQMtXM9RcBrPqrE01IJBS5TmeZ6BbSfpLM7VwAdlaR7TGxr6OqTmSfIHl2UQ5Q/fxtGCzywtcxn/jI8rP3r224jX9fHMG2Krl9KoYcvIYSPeBblsdzirlUeWjCv5Ft6y4Yrgx5WfIC0/rizxLXzD/ksHlP1GwDubB/i4EfCnzQM8aAR8sHF4T9/CSusoZ29hpXWUN7HSOkq/2yT9zQL7P38aYVW4wIYnAAAAAElFTkSuQmCC"
      style="height: 24px"
    >
    <h2>${clubName}</h2>
    <a href="?club_id=${flindersStId}">Flinders Street</a>
    <a href="?club_id=${melbCentralId}">Melbourne Central</a>
    <a href="?club_id=${qvId}">QV Platinum</a>
    <a href="?club_id=${richmondId}">Richmond</a>
    <a href="?club_id=${vicGardensId}">Vic Gardens</a>
    <a href="?club_id=${stKildaId}">St Kilda</a>
  </div>
  <div class="main">
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
        <th>
          Duration
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
          ${session.instructorName || '-'}
        </td>
        <td>
          ${session.duration} mins
        </td>
      </tr>
      `).join('')}
      <tr>
        <th colspan="3">&nbsp;</th>
      </tr>
    `).join('')}
    </tbody>
    </table>
  </div>
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
