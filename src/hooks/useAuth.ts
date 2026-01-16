// Hook de autenticación simulado para desarrollo
import { useState } from 'react';
export function useAuth() {
  const [user] = useState(USERS['a']);
  return { user };
}
const USERS = {
  v: {
    id: '64e1cd47-51eb-4e3d-ad92-f13fdbe9971c',
    name: 'Venue User',
    role: 'VENUE',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGUxY2Q0Ny01MWViLTRlM2QtYWQ5Mi1mMTNmZGJlOTk3MWMiLCJyb2xlIjoiVkVOVUUiLCJpYXQiOjE3Njg1NTI0NDUsImV4cCI6MTc2ODYzODg0NX0.Qazq7eXASBaHLxlB-dAlBQoAw0fWsEjOvf06UdR9dLs',
  },
  a: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Artist User',
    role: 'ARTIST',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiQVJUSVNUIiwiaWF0IjoxNzY4NTkzMTc5LCJleHAiOjE3Njg2Nzk1Nzl9.j519si_EnejogZF1lcNjBaWho1SMbw2WBD4q52eTUXk',
  },
  m: {
    id: '0aee46df-4986-4eae-b3a3-f4365838220e',
    name: 'Manager User',
    role: 'MANAGER',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYWVlNDZkZi00OTg2LTRlYWUtYjNhMy1mNDM2NTgzODIyMGUiLCJyb2xlIjoiTUFOQUdFUiIsImlhdCI6MTc2ODUwOTI2NiwiZXhwIjoxNzY4NTk1NjY2fQ.aWD24295VfG14k-6lbwKZotV_yq0VtD22t1K7Alpdj0',
  },
};

// Cambia aquí el tipo de usuario: 'VENUE', 'ARTIST' o 'MANAGER'
const userType = 'VENUE';


