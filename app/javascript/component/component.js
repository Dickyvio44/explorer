const mapQueryAndVariablesStore = new Map();

const graphqlQuerySubscriptionExecutor = async (url, query, componentObject, element, variables, onerror) => {
  const currentUrl = url.replace(/^http/, 'ws');
  const client = createClient({url: currentUrl});
  const payload = {query, variables: variables};

  client.subscribe(payload, {
    next: data => {
      const sub = 'subscription';
      componentObject.onData(data.data, sub);
    },
    error: error => {
      onerror(error);
    },
    complete: () => console.log('complete'),
  });
};
const isNotEmptyArray = subj => Array.isArray(subj) && subj.length;
const isNotEmptyObject = subj => !Array.isArray(subj) && typeof subj === 'object' && Object.keys(subj).length;

const graphqlQueryExecutor = async (queryId, url, query, element, variables, api_key = '') => {
  const hash = {
    ...variables,
    queryId,
  };
  const str = JSON.stringify(hash);

  if (!mapQueryAndVariablesStore.has(str)) {
    let keyHeader = {'X-API-KEY': api_key};
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...keyHeader,
      },
      body: JSON.stringify({query, variables}),
      credentials: 'same-origin',
    });
    if (response.status !== 200) {
      throw new Error(response.error);
    }
    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
    const result = {
      data,
    };
    mapQueryAndVariablesStore.set(str, result);
    return data;
  } else {
    return mapQueryAndVariablesStore.get(str).data;
  }
};

const renderQueryInComponent = async (endpoint_url, componentObject, query, compElement, variables, queryId, api_key) => {
  const graphQLResponse = await graphqlQueryExecutor(queryId, endpoint_url, query, compElement, variables, api_key);
  componentObject.onData(graphQLResponse.data);
};

const prepopulateQuery = async (url, componentObject, compElement, query, queryVariables, prePopulateId, queryId, api_key) => {
  const startQuery = query;
  let finalQuery = startQuery;
  if (prePopulateId) {
    const response = await fetch(`${window.bitqueryAPI}/getquery/${prePopulateId}`);
    let queryMetaData;
    if (response.status === 200) {
      queryMetaData = await response.json();
    } else {
      throw new Error(response.error);
    }
    finalQuery = queryMetaData.query.trim();
    const queryVariables = {
      ...JSON.parse(queryMetaData.variables),
      ...queryVariables,
    };
  }

  await renderQueryInComponent(url, componentObject, finalQuery, compElement, queryVariables, queryId, api_key);
};

const createWidgetFrame = (componentClass, selector, queryId) => {
  const componentContainer = document.querySelector(selector);
  const widgetHeader = document.createElement('div');
  const row = document.createElement('div');
  const col8 = document.createElement('div');
  const cardBody = document.createElement('div');
  const widgetFrame = document.createElement('div');
  const tableFooter = document.createElement('div');
  const getAPIButton = document.createElement('a');
  const showMoreButton = document.createElement('a');
  const loader = document.createElement('div');
  const blinkerWrapper = document.createElement('div');
  loader.classList.add('lds-dual-ring');
  getAPIButton.classList.add('badge', 'badge-secondary', 'open-btn', 'bg-success', 'get-api');
  getAPIButton.setAttribute('role', 'button');
  getAPIButton.setAttribute('target', '_blank');
  getAPIButton.textContent = 'Get Streaming API';
  showMoreButton.classList.add('more-link');
  showMoreButton.textContent = 'Show more...';
  showMoreButton.style.display = 'none';
  showMoreButton.style.cursor = 'pointer';
  tableFooter.style.display = 'flex';
  tableFooter.style.justifyContent = 'end';
  tableFooter.appendChild(showMoreButton);
  tableFooter.appendChild(getAPIButton);
  widgetHeader.classList.add('card-header');
  row.classList.add('row');
  col8.classList.add('col');
  // col8.classList.add('col-8');
  cardBody.classList.add('card-body', 'text-center');
  widgetFrame.classList.add('widget-container', 'tabulator');
  // widgetFrame.style.height = '470px';
  widgetFrame.style.height = 'fit-content';
  // widgetFrame.style.overflow = 'scroll';
  componentContainer.appendChild(widgetHeader);
  componentContainer.appendChild(cardBody);
  cardBody.appendChild(widgetFrame);
  cardBody.appendChild(tableFooter);
  widgetHeader.appendChild(row);
  row.appendChild(col8);
  const onloadmetadata = queryMetaData => {
    col8.textContent = queryMetaData?.name || 'No query presented';
    if (queryMetaData.query.match(/subscription[^a-zA-z0-9]/gm)) {
      const liveSpan = document.createElement('span');
      const blinker = document.createElement('div');
      blinkerWrapper.classList.add('col-4', 'text-success', 'text-right');
      blinker.classList.add('blink', 'blnkr', 'bg-success');
      row.appendChild(blinkerWrapper);
      liveSpan.classList.add('d-none', 'd-sm-inline');
      liveSpan.textContent = 'Live';
      blinkerWrapper.appendChild(liveSpan);
      blinkerWrapper.appendChild(blinker);
    }
  };
  const onquerystarted = () => {
    cardBody.appendChild(loader);
  };
  const onqueryend = () => {
    cardBody.removeChild(loader);
  };
  const onerror = error => {
    if (row.contains(blinkerWrapper)) {
      row.removeChild(blinkerWrapper);
    }
    cardBody.textContent = '';
    cardBody.classList.add('alert', 'alert-danger');
    cardBody.setAttribute('role', 'alert');
    const title = document.createElement('h4');
    title.classList.add('alert-heading');
    const errorText = document.createElement('div');
    errorText.classList.add('mb-0');
    cardBody.appendChild(title);
    cardBody.appendChild(errorText);
    title.textContent = 'An error occurred while executing the request. Please, try again later';
    if (Array.isArray(error)) {
      errorText.textContent = `Error: ${error[0].message}`;
    } else if ('message' in error) {
      errorText.textContent = `Error: ${error.message}`;
    } else {
      errorText.textContent = `Error: ${error}`;
    }
  };
  return {
    frame: widgetFrame,
    button: getAPIButton,
    button2: showMoreButton,
    onloadmetadata,
    onquerystarted,
    onqueryend,
    onerror,
  };
};

export default async function renderComponent(component, selector, queryId, variables = {}, prePopulateId, getNewDataForQuery, api_key) {
  document.querySelector(selector).textContent = '';
  const widgetFrame = createWidgetFrame(component, selector, queryId);
  let queryMetaData;
  try {
    const response = await fetch(`${window.bitqueryAPI}/getquery/${queryId}`);
    if (response.status === 200) {
      try {
        queryMetaData = await response.json();
      } catch (error) {
        throw new Error('There is no such query with the same url...');
      }
    } else {
      throw new Error(response.message);
    }
    widgetFrame.onloadmetadata(queryMetaData);
    const compElement = widgetFrame.frame;
    const query = queryMetaData.query.trim();

    async function getNewDataForQuery(interval = '', from, till, limit = 9990) {
      widgetFrame.button2.style.display = 'none'

      const addVariables = {
        interval: interval,
        till: till,
        from: from,
        limit: limit,
      };
      const queryVariables = {
        ...JSON.parse(queryMetaData.variables),
        ...variables,
        ...addVariables,
      };


      if (query.startsWith('subscription')) {
        await prepopulateQuery(queryMetaData.endpoint_url, componentObject, compElement, query, queryVariables, prePopulateId, queryId, api_key);
        graphqlQuerySubscriptionExecutor(queryMetaData.endpoint_url, query, componentObject, compElement, queryVariables, widgetFrame.onerror);
      } else {
        await renderQueryInComponent(queryMetaData.endpoint_url, componentObject, query, compElement, queryVariables, queryId, api_key);
      }
    }

    async function getNewLimitForShowMoreButton() {
      widgetFrame.onquerystarted();
      queryVariables.limit += 10
      console.log('queryVariables.limit',queryVariables.limit)
      componentObject.clearData();
      if (query.startsWith('subscription')) {
        await prepopulateQuery(queryMetaData.endpoint_url, componentObject, compElement, query, queryVariables, prePopulateId, queryId, api_key);
        graphqlQuerySubscriptionExecutor(queryMetaData.endpoint_url, query, componentObject, compElement, queryVariables, widgetFrame.onerror);
      } else {
        await renderQueryInComponent(queryMetaData.endpoint_url, componentObject, query, compElement, queryVariables, queryId, api_key);
      }
    widgetFrame.onqueryend();
    }

    const queryVariables = {
      ...JSON.parse(queryMetaData.variables),
      ...variables,
    };
    if (Object.getPrototypeOf(component) === BootstrapTableComponent || Object.getPrototypeOf(component) === BootstrapCardComponent){
      widgetFrame.button2.parentNode.style.justifyContent = 'space-between';
      widgetFrame.button2.style.display = 'block'
      if(query.startsWith('subscription')){
      widgetFrame.button2.style.display = 'none'
      widgetFrame.button2.parentNode.style.justifyContent = 'end';

      }
    }
    const componentObject = new component(compElement, queryVariables, getNewDataForQuery);
    const data = [];
    data.push({[WidgetConfig.name]: serialize(WidgetConfig)});
    function getBaseClass(targetClass) {
      data.push({[targetClass.name]: serialize(targetClass)});
      if (targetClass instanceof Function) {
        let baseClass = targetClass;
        while (baseClass) {
          const newBaseClass = Object.getPrototypeOf(baseClass);
          if (newBaseClass && newBaseClass !== Object && newBaseClass.name) {
            baseClass = newBaseClass;
            data.unshift({[baseClass.name]: serialize(baseClass)});
          } else {
            break;
          }
        }
      }
    }
    function discoverFunctions(subj, prop) {
      if (typeof subj === 'function') {
        if (prop && subj?.name !== prop) {
          if (!data.some(el => Object.keys(el)[0] === subj?.name)) {
            data.unshift({[subj.name]: serialize(subj)});
          }
        }
        return;
      }
      if (isNotEmptyArray(subj)) {
        for (let el of subj) {
          discoverFunctions(el);
        }
      }
      if (isNotEmptyObject(subj)) {
        for (let prop in subj) {
          discoverFunctions(subj[prop], prop);
        }
      }
    }
    getBaseClass(component);
    discoverFunctions(componentObject.config);
    widgetFrame.button.onclick = () => {
      let createHiddenField = function (name, value) {
        let input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', name);
        input.setAttribute('value', value);
        return input;
      };
      let form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', `${window.bitqueryAPI}/widgetconfig`);
      form.setAttribute('enctype', 'application/json');
      form.setAttribute('target', '_blank');
      form.appendChild(createHiddenField('data', JSON.stringify(data)));
      form.appendChild(createHiddenField('variables', JSON.stringify(queryVariables)));
      form.appendChild(createHiddenField('url', queryId));
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    };
    widgetFrame.onquerystarted();

    widgetFrame.button2.onclick =()=> getNewLimitForShowMoreButton()


    if (query.startsWith('subscription')) {
      await prepopulateQuery(queryMetaData.endpoint_url, componentObject, compElement, query, queryVariables, prePopulateId, queryId, api_key);
      graphqlQuerySubscriptionExecutor(queryMetaData.endpoint_url, query, componentObject, compElement, queryVariables, widgetFrame.onerror);
    } else {
      await renderQueryInComponent(queryMetaData.endpoint_url, componentObject, query, compElement, queryVariables, queryId, api_key);
    }
    widgetFrame.onqueryend();
  } catch (error) {
    widgetFrame.onerror(error);
  }
}
