import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { upgradeSubscription } from '../services/api';
import useAuthStore from '../store/authStore';
import { Check, Music, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';

const Pricing = () => {
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();

  const upgradeMutation = useMutation({
    mutationFn: (tier) => upgradeSubscription(tier),
    onSuccess: () => {
      alert('Welcome to Premium! Your account has been upgraded.');
      navigate('/dashboard');
    },
    onError: () => {
      alert('Upgrade failed. Please try again.');
    },
  });

  const handleUpgrade = (tier) => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    upgradeMutation.mutate(tier);
  };

  const tiers = [
    {
      name: 'Ārambh',
      price: '₹0',
      description: 'For seekers taking the first step into the tradition.',
      features: [
        'Foundational masterclasses',
        'Community listening rooms',
        'Digital tanpura (standard)',
        'Streaming audio (128 kbps)',
      ],
      buttonText: 'Current plan',
      current: true,
      premium: false,
    },
    {
      name: 'Samrāj',
      price: '₹999',
      period: '/year',
      description: 'For performers who demand the nuance of a live mehfil.',
      features: [
        'Full masterclass library incl. advanced',
        'Hi-resolution archival audio',
        'Live concert streaming',
        'Metronome, taal & practice suite',
        'Instructor feedback channel',
        'Offline mobile viewing',
      ],
      buttonText: 'Upgrade',
      current: false,
      premium: true,
    },
  ];

  return (
    <PageShell>
      <div className="text-center mb-16">
        <p className="label-caps-accent mb-4 tracking-[0.4em]">Membership</p>
        <h1 className="font-display text-display-lg font-semibold text-ivory mb-4">
          Elevate your <span className="text-gradient-gold">sādhanā</span>
        </h1>
        <p className="text-ivory/55 text-lg font-light max-w-2xl mx-auto">
          Transparent tiers — no noise. Choose the depth of immersion that matches your riyāz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: tier.premium ? -6 : -2 }}
            className={`relative rounded-3xl p-10 flex flex-col border transition-all duration-500 premium-panel ${
              tier.premium
                ? 'shadow-glow border-gold/35'
                : 'border-gold/10 hover:border-gold/20'
            }`}
          >
            {tier.premium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold-dark text-ink text-[11px] font-bold px-5 py-1.5 rounded-full uppercase tracking-[0.15em] shadow-glow-sm flex items-center gap-2">
                <Star className="w-3.5 h-3.5 fill-current" strokeWidth={0} /> Crown tier
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-display font-semibold text-ivory mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className={`text-5xl font-display font-semibold ${tier.premium ? 'text-gradient-gold' : 'text-ivory'}`}>
                  {tier.price}
                </span>
                <span className="text-ivory/40">{tier.period}</span>
              </div>
              <p className="text-ivory/50 text-sm leading-relaxed">{tier.description}</p>
            </div>

            <div className="space-y-4.5 mb-10 flex-1">
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      tier.premium ? 'bg-gold/15 text-gold border-gold/30' : 'bg-ivory/5 text-rv-text-faint border-rv-border-subtle'
                    }`}
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-rv-text-2">{feature}</span>
                </div>
              ))}
            </div>

            <motion.button
              type="button"
              whileHover={tier.premium ? { scale: 1.02 } : {}}
              whileTap={tier.premium ? { scale: 0.98 } : {}}
              onClick={() => tier.premium && handleUpgrade('Premium')}
              disabled={tier.current || upgradeMutation.isLoading}
              className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                tier.premium
                  ? 'bg-gradient-to-r from-gold-light via-gold to-gold-dark text-ink shadow-glow'
                  : 'bg-ivory/5 text-ivory/45 cursor-default border border-gold/10'
              }`}
            >
              {tier.premium ? <Zap className="w-5 h-5 fill-gold/40 text-ink" /> : null}
              {upgradeMutation.isLoading ? 'Processing…' : tier.buttonText}
            </motion.button>
          </motion.div>
        ))}
      </div>

      <p className="mt-20 text-center text-ivory/40 text-sm flex items-center justify-center gap-2">
        <Music className="w-4 h-4 text-gold/60" /> Trusted by serious students across India & the diaspora
      </p>
    </PageShell>
  );
};

export default Pricing;
