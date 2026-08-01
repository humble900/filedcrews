import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TechScore {
  staff_id: string;
  name: string;
  score: number;
  factors: {
    distance_score: number;
    skill_match: number;
    availability: number;
    performance: number; // e.g., sales rate or rating
  };
}

export interface RouteJob {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

export const useAgenticDispatch = (companyId: string) => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  /**
   * Evaluates and scores available technicians for a specific job based on:
   * 1. Distance (Drive time/Haversine)
   * 2. Skill Match (Certifications matching job requirements)
   * 3. Performance (Sales conversion rate, avg rating)
   */
  const findBestTechnicians = async (
    jobId: string,
    jobLat: number,
    jobLng: number,
    requiredSkills: string[]
  ): Promise<TechScore[]> => {
    setIsOptimizing(true);
    try {
      // 1. Fetch available field crew members for this company
      const { data: staffList, error: staffError } = await (supabase as any)
        .from("staff_profiles")
        .select("id, full_name, trade_certifications")
        .eq("company_id", companyId)
        .eq("global_role", "Field Crew");

      if (staffError) throw staffError;
      if (!staffList || staffList.length === 0) return [];

      // 2. Fetch latest GPS locations from tracker
      const { data: locations, error: locError } = await supabase
        .from("staff_locations")
        .select("staff_id, latitude, longitude")
        .in("staff_id", staffList.map(s => s.id))
        .order("timestamp", { ascending: false });

      if (locError) throw locError;

      const latestLocations = new Map();
      locations?.forEach(loc => {
        if (!latestLocations.has(loc.staff_id)) {
          latestLocations.set(loc.staff_id, { lat: loc.latitude, lng: loc.longitude });
        }
      });

      // 3. Fetch Leaderboard Stats
      const { data: statsData } = await (supabase as any)
        .from("staff_leaderboard_stats")
        .select("staff_id, current_score, total_jobs_completed")
        .in("staff_id", staffList.map(s => s.id));
        
      const statsMap = new Map();
      statsData?.forEach((stat: any) => {
        statsMap.set(stat.staff_id, stat);
      });

      // 4. Fetch Active Shifts
      const { data: shiftsData } = await (supabase as any)
        .from("staff_shifts")
        .select("staff_id, status")
        .eq("company_id", companyId)
        .eq("status", "Active")
        .in("staff_id", staffList.map(s => s.id));
        
      const activeShifts = new Set();
      shiftsData?.forEach((s: any) => activeShifts.add(s.staff_id));

      // 5. Compute scores
      const scores: TechScore[] = staffList.map((staff) => {
        // --- Distance Score ---
        let distanceScore = 0;
        const loc = latestLocations.get(staff.id);
        if (loc && jobLat && jobLng) {
          // Haversine calculation
          const R = 6371; // km
          const dLat = (loc.lat - jobLat) * (Math.PI / 180);
          const dLon = (loc.lng - jobLng) * (Math.PI / 180);
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(jobLat * (Math.PI / 180)) * Math.cos(loc.lat * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2); 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
          const distanceKm = R * c;
          
          // closer = higher score (max 100 for < 5km, drops off)
          distanceScore = Math.max(0, 100 - (distanceKm * 2));
        }

        // --- Skill Score ---
        let skillScore = 100;
        if (requiredSkills && requiredSkills.length > 0) {
          const staffCerts: string[] = (staff.trade_certifications as string[]) || [];
          const matches = requiredSkills.filter(req => staffCerts.includes(req)).length;
          skillScore = (matches / requiredSkills.length) * 100;
        }

        // --- Performance Score ---
        const staffStat = statsMap.get(staff.id);
        const performanceScore = staffStat ? Math.min(100, Math.max(0, staffStat.current_score || 80)) : 80;

        // --- Availability Score ---
        const availability = activeShifts.has(staff.id) ? 100 : 20;

        // Calculate weighted final score
        // 40% Distance, 30% Skill, 20% Performance, 10% Availability
        const finalScore = (distanceScore * 0.4) + (skillScore * 0.3) + (performanceScore * 0.2) + (availability * 0.1);

        return {
          staff_id: staff.id,
          name: staff.full_name,
          score: Math.round(finalScore),
          factors: {
            distance_score: Math.round(distanceScore),
            skill_match: Math.round(skillScore),
            availability: availability,
            performance: Math.round(performanceScore)
          }
        };
      });

      // Sort by highest score
      return scores.sort((a, b) => b.score - a.score);

    } catch (err) {
      console.error("Agentic Dispatch Error:", err);
      return [];
    } finally {
      setIsOptimizing(false);
    }
  };

  /**
   * Automatically assigns a job to the best available technician
   */
  const autoAssignJob = async (jobId: string, jobLat: number, jobLng: number, requiredSkills: string[] = []) => {
    const scoredTechs = await findBestTechnicians(jobId, jobLat, jobLng, requiredSkills);
    
    if (scoredTechs.length === 0) {
      throw new Error("No available technicians found for auto-assignment.");
    }

    const bestTech = scoredTechs[0];
    
    // Assign the job
    const { error } = await supabase
      .from("jobs")
      .update({
        assigned_staff_id: bestTech.staff_id,
        status: "Scheduled"
      })
      .eq("id", jobId);

    if (error) throw error;

    return bestTech;
  };

  /**
   * True Route Optimization (TSP)
   * Sorts a list of daily jobs to minimize total driving distance using a Nearest Neighbor algorithm.
   */
  const optimizeDailyRoute = async (
    jobs: RouteJob[],
    startLat: number,
    startLng: number
  ): Promise<RouteJob[]> => {
    setIsOptimizing(true);
    try {
      if (jobs.length <= 1) {
        return jobs;
      }

      // Check if we have a Google Maps API Key configured
      const { data: apiKeys } = await supabase
        .from("api_keys")
        .select("key_value")
        .eq("company_id", companyId)
        .eq("provider", "google_maps")
        .maybeSingle();

      const GOOGLE_API_KEY = apiKeys?.key_value || null;

      if (GOOGLE_API_KEY && jobs.length <= 25) { // Directions API max waypoints is 25
        // Use Google Directions API (Waypoint Optimization)
        const origin = `${startLat},${startLng}`;
        const destination = origin; // Round trip
        
        const waypoints = jobs.map(j => `${j.latitude},${j.longitude}`).join('|');
        
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&key=${GOOGLE_API_KEY}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status === "OK" && data.routes && data.routes[0]) {
          const waypointOrder: number[] = data.routes[0].waypoint_order;
          // waypointOrder contains the optimized index order for the waypoints
          const optimized = waypointOrder.map(index => jobs[index]);
          return optimized;
        } else {
          console.warn("Google Directions API optimization failed, falling back to nearest neighbor:", data);
        }
      }

      // Fallback: Nearest Neighbor algorithm
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2); 
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      };

      const unvisited = [...jobs];
      const optimized: RouteJob[] = [];
      let currentLat = startLat;
      let currentLng = startLng;

      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const d = getDistance(currentLat, currentLng, unvisited[i].latitude, unvisited[i].longitude);
          if (d < minDistance) {
            minDistance = d;
            nearestIdx = i;
          }
        }

        const nextJob = unvisited.splice(nearestIdx, 1)[0];
        optimized.push(nextJob);
        currentLat = nextJob.latitude;
        currentLng = nextJob.longitude;
      }

      return optimized;
    } catch (err) {
      console.error("Route Optimization Error:", err);
      return jobs; // Return unoptimized on error
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    isOptimizing,
    findBestTechnicians,
    autoAssignJob,
    optimizeDailyRoute
  };
};
