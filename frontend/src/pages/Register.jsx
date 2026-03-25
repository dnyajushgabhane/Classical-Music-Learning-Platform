import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { registerCall } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock } from 'lucide-react';
import LogoMark from '../components/LogoMark';
import PageShell from '../components/layout/PageShell';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const data = await registerCall({ name, email, password, role });
      login(data);
      if (data.role === 'Instructor') {
        navigate('/instructor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Registration Failed');
    }
  };

  const input =
    'w-full bg-ink/50 border border-gold/15 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-gold/45 focus:ring-1 focus:ring-gold/25 transition-all text-ivory placeholder:text-ivory/35';

  const roleBtn = (active) =>
    `py-3 rounded-xl border transition-all font-semibold text-sm ${active ? 'bg-gold/15 border-gold/50 text-gold shadow-glow-sm' : 'bg-ink/60 border-gold/10 text-ivory/50 hover:border-gold/25'}`;

  return (
    <PageShell className="flex justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 md:p-12 rounded-3xl w-full max-w-md relative overflow-hidden border-gold/20"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="text-center mb-10 relative">
          <div className="w-16 h-16 rounded-2xl border border-gold/25 bg-gold/5 flex items-center justify-center mx-auto mb-5">
            <LogoMark className="w-10 h-10" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-ivory">Create account</h2>
          <p className="text-ivory/50 mt-2 font-light">Join the gurukul — curated, quiet, uncompromising.</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">Full name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/45" />
              <input
                type="text"
                placeholder="Your name"
                className={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/45" />
              <input
                type="email"
                placeholder="you@example.com"
                className={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/45" />
              <input
                type="password"
                placeholder="••••••••"
                className={input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('Student')} className={roleBtn(role === 'Student')}>
                Student
              </button>
              <button type="button" onClick={() => setRole('Instructor')} className={roleBtn(role === 'Instructor')}>
                Teacher
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full bg-gradient-to-r from-gold-light via-gold to-gold-dark text-ink font-bold py-4 rounded-xl shadow-glow"
          >
            Create account
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-ivory/45">
          Already have an account?{' '}
          <Link to="/login" className="text-gold font-semibold link-underline-gold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </PageShell>
  );
};

export default Register;
