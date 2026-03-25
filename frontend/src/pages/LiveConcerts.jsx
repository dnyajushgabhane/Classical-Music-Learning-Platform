import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchEvents, bookEventTicket } from '../services/api';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { Calendar, Video, Ticket, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';

const mockEvents = [
  {
    _id: '1',
    title: 'Monsoon Ragas Festival',
    artist: { name: 'Ustad Tariq Khan' },
    date: '2026-07-15T18:00:00Z',
    price: 999,
    isLive: true,
    attendees: [1, 2, 3],
  },
  {
    _id: '2',
    title: 'Sitar Recital — Evening Melodies',
    artist: { name: 'Vid. Shankar' },
    date: '2026-07-20T19:00:00Z',
    price: 499,
    isLive: false,
    attendees: [],
  },
];

const LiveConcerts = () => {
  const { userInfo } = useAuthStore();
  const navigate = useNavigate();

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    retry: false,
  });

  const bookTicketMutation = useMutation({
    mutationFn: bookEventTicket,
    onSuccess: () => {
      alert('Ticket booked successfully!');
      refetch();
    },
    onError: () => {
      alert('Failed to book ticket. Are you logged in?');
      navigate('/login');
    },
  });

  const displayEvents = events || mockEvents;

  if (isLoading) {
    return (
      <PageShell>
        <p className="text-gold text-center py-24 text-xl font-display animate-pulse">Gathering the mehfil…</p>
      </PageShell>
    );
  }

  const handleBooking = (eventId) => {
    bookTicketMutation.mutate(eventId);
  };

  return (
    <PageShell>
      <header className="mb-14">
        <p className="text-xs uppercase tracking-[0.35em] text-gold/70 mb-4">Live</p>
        <h1 className="font-display text-display-lg font-semibold text-ivory mb-4">
          Exclusive <span className="text-gradient-gold">concerts</span>
        </h1>
        <p className="text-ivory/55 text-lg max-w-2xl font-light">
          High-fidelity streams — as if the tanpura were beside you, and the hall breathing in the same laya.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {displayEvents.map((event, idx) => {
          const isAttending = userInfo && event.attendees?.includes(userInfo._id);

          return (
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={event._id}
              className="music-sheet-card rounded-2xl p-8 relative overflow-hidden group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-copper to-gold-dark opacity-90 rounded-l-2xl" />
              {event.isLive && (
                <div className="absolute top-5 right-5 bg-maroon/80 text-gold text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-gold/30 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" /> LIVE
                </div>
              )}

              <h3 className="text-2xl font-display font-semibold text-ivory mb-2 pr-24">{event.title}</h3>
              <p className="text-gold/90 font-medium mb-8">Featuring {event.artist?.name || 'Grandmaster'}</p>

              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                <div className="flex items-center gap-3 text-ivory/65">
                  <Calendar className="w-5 h-5 text-gold/50 shrink-0" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3 text-ivory/65">
                  <Users className="w-5 h-5 text-gold/50 shrink-0" />
                  {event.attendees?.length || 0} attending
                </div>
                <div className="flex items-center gap-3 text-ivory/65">
                  <Video className="w-5 h-5 text-gold/50 shrink-0" />
                  4K stream
                </div>
                <div className="flex items-center gap-3 font-semibold text-gradient-gold">
                  <Ticket className="w-5 h-5 text-gold shrink-0" />₹{event.price}
                </div>
              </div>

              <div className="flex gap-4">
                {isAttending ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/live/${event._id}`)}
                    className="flex-1 py-3.5 rounded-xl font-semibold bg-gold/15 text-gold border border-gold/35 flex items-center justify-center gap-2 hover:bg-gold/20 transition-colors"
                  >
                    <Video className="w-5 h-5" /> Join stream
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBooking(event._id)}
                    disabled={bookTicketMutation.isLoading}
                    className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
                      event.isLive
                        ? 'bg-gradient-to-r from-gold to-gold-dark text-ink shadow-glow-sm'
                        : 'border border-gold/40 text-gold hover:bg-gold/10'
                    }`}
                  >
                    {bookTicketMutation.isLoading ? 'Processing…' : event.isLive ? 'Reserve seat' : 'Pre-book'}
                  </motion.button>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </PageShell>
  );
};

export default LiveConcerts;
