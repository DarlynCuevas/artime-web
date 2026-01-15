// Hook de autenticación simulado para desarrollo
import { useState } from 'react';

export function useAuth() {
  // Simula un usuario autenticado
  const [user] = useState({
    id: '64e1cd47-51eb-4e3d-ad92-f13fdbe9971c',
    name: 'Sala Test',
    role: 'VENUE',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGUxY2Q0Ny01MWViLTRlM2QtYWQ5Mi1mMTNmZGJlOTk3MWMiLCJyb2xlIjoiVkVOVUUiLCJpYXQiOjE3Njg0MDA4MTAsImV4cCI6MTc2ODQ4NzIxMH0.1P6OeIlL8kkw7S35Cs0cNWxz6e8no4jucFPjxLJiPro', 
    // agrega más campos si lo necesitas
  });
  return { user };
}
