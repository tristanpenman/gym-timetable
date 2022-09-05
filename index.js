import('node-fetch').then(({default: fetch}) => {
  const monday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const plusNDays = (d, n) => {
    d.setDate(d.getDate() + n);
    return d;
  }

  const dateStamp = (d) => {
    return `${d.getFullYear()}-${`0${d.getMonth() + 1}`.slice(-2)}-${`0${d.getDate()}`.slice(-2)}`;
  };

  const timestamp = (d, t) => {
    const ts = `${dateStamp(d)}T${t}`;
    return ts;
  };

  const load = async (clubIds) => {
    const options = {
      mode: 'no-cors'
    };

    const m = monday();

    const params = {
      FromDate: timestamp(m, '00:00:00'),
      ToDate: timestamp(plusNDays(m, 6), '23:59:59'),
      ClubIds: clubIds.join(',')
    };

    console.error(params);
    
    const result = await fetch(`https://api.fitnessfirst.com.au/classes/v1/api/sessions?${new URLSearchParams(params).toString()}`, options);

    const data = await result.json();
    const sessions = data.sessions;
    const sorted = sessions.sort((a, b) => new Date(a.startDate) < new Date(b.startDate));

    const bucketed = [];
    sorted.forEach((session) => {
        const d = dateStamp(new Date(session.startDate));
        if (bucketed.length === 0 || bucketed[bucketed.length - 1].date !== d) {
            bucketed.push({
                date: d,
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

    const output = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Group Fitness Timetable</title>
    <style>
    @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700');

    *, *:before, *:after {
        box-sizing:border-box;
    }
    
    body {
        padding:24px;
        font-family:'Source Sans Pro', sans-serif;
        margin:0;
        text-align:left;
    }
    
    td {
        padding-right: 15px;
    }

    h1,h2,h3,h4,h5,h6 {
        margin:0;
    }
    </style>
</head>
<body>
    <h1>Group Fitness Timetable</h1>
    <h2>Melbourne Central</h2>
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

    console.log(output);
  };

  const clubIds = [
    '45b4263e-7633-4578-9934-1f765c1723ad'
  ];

  load(clubIds);
});