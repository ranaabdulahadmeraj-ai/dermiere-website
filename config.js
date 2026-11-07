// Clinic details. Edit this file to change locations, services, hours or slot length.
module.exports = {
  clinic: {
    name: 'Dermiére Aesthetic & Wellness Clinic',
    doctor: 'Dr. Anusha Liaqat',
    phones: ['0304-6571349', '0323-6062601'],
    whatsapp: '923046571349', // international format, no +
    instagram: 'dermiere.isb',
    timezone: 'Asia/Karachi',
  },
  locations: [
    {
      id: 'f10',
      name: 'F-10/1, Islamabad',
      address: 'Ahmed Faraz Road, F-10/1, Islamabad',
      mapQuery: 'Ahmed Faraz Road F-10/1 Islamabad',
    },
    {
      id: 'gulberg',
      name: 'Gulberg Greens, Islamabad',
      address: 'The Palazzo, The Expressway, Gulberg Greens, Islamabad',
      mapQuery: 'The Palazzo Gulberg Greens Islamabad',
    },
  ],
  services: [
    { id: 'consultation', name: 'Skin Consultation', category: 'Consultation',
      blurb: 'A one-to-one assessment with Dr. Anusha to plan the right treatment for your skin.' },
    { id: 'laser', name: 'Laser Hair Removal', category: 'Laser',
      blurb: 'Painless, quick sessions for smooth, long-lasting results on face and body.' },
    { id: 'prp', name: 'PRP & Microneedling', category: 'Skin',
      blurb: 'Collagen-boosting microneedling with your own platelet-rich plasma for texture, scars and glow.' },
    { id: 'polynucleotide', name: 'Polynucleotide Under-Eye', category: 'Aesthetic',
      blurb: 'Regenerative under-eye treatment for dark circles, fine lines and tired-looking eyes.' },
    { id: 'acne', name: 'Acne Treatment', category: 'Skin',
      blurb: 'Medical-grade plans for active acne, marks and scarring, tailored to your skin type.' },
    { id: 'antiaging', name: 'Anti-Aging Treatments', category: 'Aesthetic',
      blurb: 'Treatments that soften lines, restore firmness and keep skin looking naturally youthful.' },
  ],
  hours: {
    openDays: [1, 2, 3, 4, 5, 6], // Mon-Sat (0 = Sunday)
    open: '12:00',
    close: '18:00',
    slotMinutes: 30,
    patientsPerSlot: 1, // bookings allowed per slot, per location
    maxDaysAhead: 60,
  },
};
