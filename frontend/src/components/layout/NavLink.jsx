import React from 'react';
import { NavLink } from 'react-router-dom';

export const navLinkClass = ({ isActive }) =>
  `link-underline-gold text-sm font-medium tracking-wide transition-colors ${
    isActive ? 'text-gold' : 'text-ivory/70 hover:text-ivory'
  }`;

export function NavBarLink(props) {
  return <NavLink {...props} className={navLinkClass} />;
}
