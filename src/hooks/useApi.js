import { useEffect, useState } from 'react';
import { api } from '../services/api';
export function useApi(path, params = {}) {
  const key = JSON.stringify(params),
    requestKey = path + key;
  const [state, setState] = useState({
    key: null,
    data: null,
    error: '',
    loading: true
  });
  useEffect(() => {
    const c = new AbortController();
    api(path, JSON.parse(key), c.signal).then(data => setState({
      key: requestKey,
      data,
      error: '',
      loading: false
    })).catch(e => {
      if (e.name !== 'AbortError') setState({
        key: requestKey,
        data: null,
        error: e.message,
        loading: false
      });
    });
    return () => c.abort();
  }, [path, key, requestKey]);
  return state.key === requestKey ? state : {
    data: null,
    error: '',
    loading: true
  };
}
