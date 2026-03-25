import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../services/api';
import { Search } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import CourseCard from '../components/CourseCard';
import FloatingNotes from '../components/effects/FloatingNotes';

const sampleCourses = [
  {
    _id: '1',
    title: 'Mastering Raag Yaman',
    instructor: { name: 'Pt. Sharma' },
    level: 'Beginner',
    category: 'Vocal',
    price: 1999,
    mood: 'Meditative',
    composer: 'Pt. Ravi Shankar',
    rating: 4.9,
    thumbnail:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&q=80',
  },
  {
    _id: '2',
    title: 'Advanced Tabla: Relā & Gat',
    instructor: { name: 'Ustad Khan' },
    level: 'Advanced',
    category: 'Percussion',
    price: 2499,
    mood: 'Energetic',
    rating: 5,
    thumbnail:
      'https://images.unsplash.com/photo-1519892309165-4220a747bfa1?w=640&q=80',
  },
  {
    _id: '3',
    title: 'Sitar: Bāj & Meend',
    instructor: { name: 'Vid. Das' },
    level: 'Intermediate',
    category: 'Strings',
    price: 1499,
    mood: 'Joyful',
    rating: 4.7,
    thumbnail:
      'https://images.unsplash.com/photo-1676302492425-3e1f955a3d18?w=640&q=80',
  },
];

export default function Courses() {
  const [searchParams, setSearchParams] = useState({ q: '', mood: '', composer: '' });

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses', searchParams],
    queryFn: () => fetchCourses(searchParams),
    retry: false,
  });

  const displayCourses = courses || sampleCourses;

  const handleSearchChange = (e) =>
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });

  const inputClass =
    'w-full bg-ink/60 border border-gold/15 rounded-xl px-4 py-3.5 text-ivory placeholder:text-ivory/35 focus:outline-none focus:border-gold/45 focus:ring-1 focus:ring-gold/25 transition-all';

  return (
    <div className="relative">
      <div className="pointer-events-none absolute top-0 right-0 w-full h-64 opacity-30">
        <FloatingNotes count={6} />
      </div>

      <PageShell>
        <header className="mb-14">
          <p className="text-xs uppercase tracking-[0.35em] text-gold/70 mb-4">Curriculum</p>
          <h1 className="font-display text-display-lg font-semibold text-ivory mb-4">
            Explore <span className="text-gradient-gold">masterclasses</span>
          </h1>
          <p className="text-ivory/55 text-lg max-w-2xl font-light">
            Hand-picked journeys through vocal, strings, and percussion — taught with the rigour of a gharānā.
          </p>
        </header>

        <div className="relative glass-panel rounded-2xl p-8 mb-14 border-gold/20">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-gold via-copper to-gold-dark opacity-90" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pl-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
                <input
                  type="text"
                  name="q"
                  placeholder="Raag Bhairav, taan, bandish..."
                  value={searchParams.q}
                  onChange={handleSearchChange}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">
                Rasa / mood
              </label>
              <select
                name="mood"
                value={searchParams.mood}
                onChange={handleSearchChange}
                className={inputClass}
              >
                <option value="">All</option>
                <option value="Meditative">Meditative</option>
                <option value="Joyful">Joyful</option>
                <option value="Romantic">Romantic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ivory/45 uppercase tracking-widest mb-2">
                Composer
              </label>
              <input
                type="text"
                name="composer"
                placeholder="Tansen, Tyāgarāja..."
                value={searchParams.composer}
                onChange={handleSearchChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gold text-center py-24 text-xl font-display animate-pulse">Tuning the archive…</p>
        ) : (
          <>
            {error ? (
              <p className="text-saffron/90 text-center py-4 mb-8 text-sm border border-saffron/20 rounded-xl bg-saffron/5">
                Could not reach the library — showing curated picks below.
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {displayCourses.map((course, idx) => (
                <CourseCard key={course._id} course={course} index={idx} />
              ))}
            </div>
          </>
        )}
      </PageShell>
    </div>
  );
}
