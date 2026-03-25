import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { loginCall } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LogoMark from '../components/LogoMark';
import PageShell from '../components/layout/PageShell';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const data = await loginCall({ email, password });

      if (data.role !== role) {
        alert(
          `This account is not registered as a ${role === 'Instructor' ? 'Teacher' : role}. Please login with the correct role.`
        );
        return;
      }

      login(data);
      if (data.role === 'Instructor') {
        navigate('/instructor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Login Failed. Check your credentials or server status.');
    }
  };

  const roleBtn = (active) =>
    `flex-1 py-3 rounded-xl border transition-all font-semibold text-sm ${active ? 'bg-gold/15 border-gold/50 text-gold shadow-glow-sm' : 'bg-ink/60 border-gold/10 text-ivory/50 hover:border-gold/25'}`;

  const input =
    'w-full bg-ink/50 border border-gold/15 rounded-xl px-4 py-3.5 focus:outline-none focus:border-gold/45 focus:ring-1 focus:ring-gold/25 transition-all text-ivory placeholder:text-ivory/35';

  return (
    <PageShell className="flex justify-center items-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-10 md:p-12 rounded-3xl w-full max-w-md relative overflow-hidden border-gold/20"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="text-center mb-10 relative">
          <LogoMark className="w-14 h-14 mx-auto mb-5" />
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-ivory">Welcome back</h2>
          <p className="text-ivory/50 mt-2 font-light">Resume your journey into the gharānās.</p>
        </div>

        <div className="flex gap-3 mb-10">
          <button type="button" onClick={() => setRole('Student')} className={roleBtn(role === 'Student')}>
            Student
          </button>
          <button type="button" onClick={() => setRole('Instructor')} className={roleBtn(role === 'Instructor')}>
            Teacher
          </button>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">Email</label>
            <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full bg-gradient-to-r from-gold-light via-gold to-gold-dark text-ink font-bold py-3.5 px-4 rounded-xl shadow-glow"
          >
            Sign in
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-ivory/45">
          New to RaagVidya?{' '}
          <Link to="/register" className="text-gold font-semibold link-underline-gold">
            Create an account
          </Link>
        </p>
      </motion.div>
    </PageShell>
  );
};

export default Login;
