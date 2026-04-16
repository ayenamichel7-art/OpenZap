import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Instances from './pages/Instances';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Channels from './pages/Channels';
import Stats from './pages/Stats';
import ApiConfig from './pages/ApiConfig';
import Guardian from './pages/Guardian';
import SuperAdmin from './pages/SuperAdmin';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Dashboard />} />
          <Route path="instances" element={<Instances />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="channels" element={<Channels />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="stats" element={<Stats />} />
          <Route path="api-config" element={<ApiConfig />} />
          <Route path="guardian" element={<Guardian />} />
          <Route path="admin" element={<SuperAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

