import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import $ from 'jquery';

$.get('report.json').then((result, i) => {
  ReactDOM.render(
    <App
      features={result}
    />,
    document.getElementById('root')
  );
});


registerServiceWorker();
