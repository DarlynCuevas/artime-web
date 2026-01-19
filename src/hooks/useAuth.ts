// Hook de autenticación simulado para desarrollo
import { useState } from 'react';
export function useAuth() {
  const [user] = useState(USERS['v']);
  return { user };
}
const USERS = {
  v: {
    id: '64e1cd47-51eb-4e3d-ad92-f13fdbe9971c',
    name: 'Venue User',
    role: 'VENUE',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGUxY2Q0Ny01MWViLTRlM2QtYWQ5Mi1mMTNmZGJlOTk3MWMiLCJyb2xlIjoiVkVOVUUiLCJpYXQiOjE3Njg3NDMxNzUsImV4cCI6MTc2ODgyOTU3NX0.gOSBkD3B_dl_h08FRNLiEKSRSmySEN_BQpHeOeAZ8J8',
  },
  a: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Artist User',
    role: 'ARTIST',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiQVJUSVNUIiwiaWF0IjoxNzY4ODEyNTc0LCJleHAiOjE3Njg4OTg5NzR9.6jvFktwYdfFlCNvZsAd55mS5ll0yOxkgyiFnkcvDd0c',
  },
  m: {
    id: '0aee46df-4986-4eae-b3a3-f4365838220e',
    name: 'Manager User',
    role: 'MANAGER',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYWVlNDZkZi00OTg2LTRlYWUtYjNhMy1mNDM2NTgzODIyMGUiLCJyb2xlIjoiTUFOQUdFUiIsImlhdCI6MTc2ODUwOTI2NiwiZXhwIjoxNzY4NTk1NjY2fQ.aWD24295VfG14k-6lbwKZotV_yq0VtD22t1K7Alpdj0',
  },
  aa: {
    id: '11111111-1111-1111-1111-111111111122',
    name: 'Artist User',
    role: 'ARTIST',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMjIiLCJyb2xlIjoiQVJUSVNUIiwiaWF0IjoxNzY4ODE1MzQ0LCJleHAiOjE3Njg5MDE3NDR9.6WsL7BBzwsr4gqEl5Q3VR730oRmN-_cuUv8OIsHjBSk',
  },
};




