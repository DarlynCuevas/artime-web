// Hook de autenticación simulado para desarrollo
import { useState } from 'react';

export function useAuth() {
  // Simula un usuario autenticado
  const [user] = useState({
    id: '64e1cd47-51eb-4e3d-ad92-f13fdbe9971c',
    name: 'Sala Test',
    role: 'VENUE',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGUxY2Q0Ny01MWViLTRlM2QtYWQ5Mi1mMTNmZGJlOTk3MWMiLCJyb2xlIjoiIFZFTlVFIiwiaWF0IjoxNzY4MzEyMzY2LCJleHAiOjE3NjgzOTg3NjZ9.ggGL2J2buC78-h3AHLiboepFf61buthZtRo2oAjpV0o', 
    // agrega más campos si lo necesitas
  });
  return { user };
}
