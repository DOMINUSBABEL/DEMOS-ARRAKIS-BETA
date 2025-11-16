import { PartyData, DHondtAnalysis, DHondtStep, SeatAllocation } from '../types';

export const calculateDHondt = (parties: PartyData[], totalSeats: number): DHondtAnalysis => {
  if (parties.length === 0 || totalSeats <= 0) {
    return {
      seats: [],
      steps: [],
      totalVotes: 0,
      votesPerSeat: [],
      lastSeatWinner: null,
      runnerUp: null,
      totalSeats: totalSeats,
    };
  }

  const validParties = parties.filter(p => p.votes > 0);
  const totalVotes = validParties.reduce((sum, p) => sum + p.votes, 0);

  const seatAllocations: { [partyName: string]: number } = {};
  validParties.forEach(p => (seatAllocations[p.name] = 0));

  const steps: DHondtStep[] = [];
  let lastSeatWinner: DHondtStep | null = null;
  let runnerUp: DHondtStep | null = null;

  for (let seatNumber = 1; seatNumber <= totalSeats; seatNumber++) {
    let maxQuotient = -1;
    let winningParty: string | null = null;
    
    const currentQuotients: { party: string, quotient: number }[] = [];

    validParties.forEach(party => {
      const quotient = party.votes / (seatAllocations[party.name] + 1);
      currentQuotients.push({ party: party.name, quotient });
    });

    currentQuotients.sort((a, b) => b.quotient - a.quotient);
    
    if (currentQuotients.length > 0) {
        maxQuotient = currentQuotients[0].quotient;
        winningParty = currentQuotients[0].party;
    }

    if (!winningParty) continue;

    seatAllocations[winningParty]++;

    const step: DHondtStep = {
      seatNumber,
      party: winningParty,
      quotient: maxQuotient,
      partyVotes: validParties.find(p => p.name === winningParty)?.votes || 0,
      seatsWon: seatAllocations[winningParty],
    };
    steps.push(step);
    lastSeatWinner = step;
    
    if (currentQuotients.length > 1) {
        const runnerUpQuote = currentQuotients[1];
        runnerUp = {
            seatNumber: seatNumber,
            party: runnerUpQuote.party,
            quotient: runnerUpQuote.quotient,
            partyVotes: validParties.find(p => p.name === runnerUpQuote.party)?.votes || 0,
            seatsWon: seatAllocations[runnerUpQuote.party]
        };
    } else {
        runnerUp = null;
    }
  }

  const finalSeats: SeatAllocation[] = Object.entries(seatAllocations)
    .map(([party, seats]) => ({ party, seats }))
    .sort((a, b) => b.seats - a.seats);

  const votesPerSeat = finalSeats
    .filter(s => s.seats > 0)
    .map(s => {
      const partyVotes = validParties.find(p => p.name === s.party)?.votes || 0;
      return {
        party: s.party,
        votes: Math.round(partyVotes / s.seats),
      };
    }).sort((a, b) => a.votes - b.votes);

  return {
    seats: finalSeats,
    steps,
    totalVotes,
    votesPerSeat,
    lastSeatWinner,
    runnerUp,
    totalSeats: totalSeats
  };
};