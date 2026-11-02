# Exercise Catalog: candidates for the new exercise library

A shortlist of bodyweight exercises inspired by **Chris Heria (THENX)** and **Calisthenicmovement**. Tick the ones you like (`[x]`), or just reply with the IDs (e.g. `PU3, PL2, CO7`). The picks move into `src/data/exercises.json`.

**Source key**
- **CH ✓**: confirmed in a written THENX breakdown of a Chris Heria video (links at the bottom)
- **CH**: a Chris Heria staple, not confirmed in writing this session
- **CM**: a Calisthenicmovement staple, from their progression system. Not confirmed in writing: their channel and site didn't expose text I could read, so check these against the videos.

**Columns map to the current data structure:** `Primary / Secondary` → `muscleGroup` / `secondaryMuscle`. `Default` → `defaultSets` × `defaultReps` (or `defaultDuration` for holds, `failure` for max reps). `Rest · Tempo` → `restSeconds` · `tempo`. `Cues` → `description`. `Progression` → `progressionPath`. Descriptions are written in my own words.

**Equipment tags:** 🏠 floor / wall / chair / table / towel (home-friendly, like your current set) · 🟦 pull-up bar · 🟪 dip bars / parallettes · ⭕ rings

---

## PU: Push (horizontal)

| ✔ | ID | Name | Primary / Secondary | Default | Rest · Tempo | Equip | Cues | Progression | Source |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | PU1 | Incline Push-Up | Chest / Triceps, Front Delts | 3×12 | 60s · 2-0-1-0 | 🏠 Chair / Table | Hands on an elevated edge, body in one straight line. Lower chest to the edge. | Lower incline → Knee Push-Up → Push-Up | CM |
| [ ] | PU2 | Knee Push-Up | Chest / Triceps, Core | 3×12 | 60s · 2-0-1-0 | 🏠 Floor | Straight line from knees to head. Elbows about 45°. | Push-Up | CM |
| [ ] | PU3 | Push-Up | Chest / Triceps, Shoulders, Core | 3×12 | 60s · 2-0-1-0 | 🏠 Floor | Full-body tension, elbows about 45°, chest all the way to the floor. | Diamond → Archer → One-Arm | CH ✓ / CM |
| [ ] | PU4 | Push-Up to 90° Hold | Chest, Triceps / Shoulders, Core | 3×8 | 75s · 2-3-1-0 | 🏠 Floor | Lower to the bottom, hold with elbows bent at 90° and chest hovering, then press up. | Longer hold → Pseudo Planche Push-Up | CH ✓ |
| [ ] | PU5 | Diamond Push-Up | Triceps / Inner Chest, Shoulders | 3×10 | 75s · 2-0-1-0 | 🏠 Floor | Thumbs and index fingers form a diamond under the chest. Elbows track back. | Hand-Over Diamond → Bodyweight Skull Crusher | CH ✓ / CM |
| [ ] | PU6 | Archer Push-Up | Chest / Triceps, Shoulders | 3×6 / side | 90s · 2-0-1-0 | 🏠 Floor | Wide hands. One arm bends while the other stays straight like drawing a bow. | Assisted One-Arm → One-Arm Push-Up | CH ✓ / CM |
| [ ] | PU7 | Pseudo Planche Push-Up | Chest, Front Delts / Biceps, Triceps, Core | 3×8 | 90s · 2-1-1-0 | 🏠 Floor | Hands by the hips, fingers turned out or back, lean forward past the hands. Keep that lean the whole set. | Supinated (palms forward) → Tuck Planche | CH ✓ |
| [ ] | PU8 | Fingertip / Knuckle Push-Up | Chest / Forearms, Wrists | 3×8 | 75s · 2-0-1-0 | 🏠 Floor | Cycle palm → fingertips → knuckles within a set. Build wrist tolerance slowly. | Push-Up to Fingertips (explosive) | CH ✓ |
| [ ] | PU9 | Explosive Push-Up | Chest / Triceps, Shoulders | 3×6 | 90s · 2-0-X-0 | 🏠 Floor | Push hard enough for hands to leave the floor. Land softly with bent elbows. | Clap → Superman Push-Up | CH ✓ |
| [ ] | PU10 | Superman Push-Up | Full Body / Chest, Core | 3×4 | 120s · 2-0-X-0 | 🏠 Floor | Explode so hands and feet leave the ground, arms reaching forward mid-air. | Explosive One-Arm Push-Up | CH ✓ |
| [ ] | PU11 | One-Arm Push-Up | Chest / Triceps, Core, Obliques | 3×3 / side | 120s · 3-0-1-0 | 🏠 Floor | Feet wide for balance, hips square, free hand behind the back. | Elevated → Floor → Explosive | CH ✓ / CM |

## VP: Push (vertical / dips)

| ✔ | ID | Name | Primary / Secondary | Default | Rest · Tempo | Equip | Cues | Progression | Source |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | VP1 | Pike Push-Up | Shoulders / Triceps, Upper Chest | 3×8 | 90s · 2-0-1-0 | 🏠 Floor | Hips high, head travels forward of the hands to form a tripod. | Elevated Pike → Wall Handstand Push-Up | CH ✓ / CM |
| [ ] | VP2 | Elevated Pike Push-Up | Shoulders / Triceps, Core | 3×6 | 90s · 2-0-1-0 | 🏠 Chair / Couch | Feet on a chair, hips stacked over shoulders. Lower the head to the floor in front of the hands. | Wall HSPU Negatives | CM |
| [ ] | VP3 | Wall Walk / Wall Handstand Hold | Shoulders / Core, Traps | 3×30s | 90s · hold | 🏠 Wall | Walk feet up the wall, chest toward the wall, push the floor away, ribs tucked. | Longer hold → Wall HSPU | CM |
| [ ] | VP4 | Wall Handstand Push-Up | Shoulders / Triceps, Traps | 3×4 | 120s · 3-0-1-0 | 🏠 Wall | Lower the head to a tripod position under control. Press back to lockout. | Deficit → Freestanding HSPU | CH / CM |
| [ ] | VP5 | Chair / Bench Dips | Triceps / Chest, Front Delts | 3×12 | 60s · 2-0-1-0 | 🏠 Chair | Hands on the chair edge behind you, shoulders down. Lower to about 90° elbows. | Feet elevated → Parallel Bar Dips | CH ✓ / CM |
| [ ] | VP6 | Parallel Bar Dips | Chest, Triceps / Shoulders | 3×8 | 90s · 2-0-1-0 | 🟪 Dip bars / 2 sturdy chairs | Slight forward lean, shoulders down. Lower until shoulders are just below the elbows. | Weighted → Ring Dips → Straight Bar Dips | CH ✓ / CM |
| [ ] | VP7 | Bodyweight Skull Crusher | Triceps / Core | 3×10 | 75s · 3-0-1-0 | 🏠 Floor / Table edge | From a plank on forearms or hands, bend at the elbows so the head travels toward the hands, then press back out. | Lower surface → Floor | CH ✓ |

## PL: Pull

| ✔ | ID | Name | Primary / Secondary | Default | Rest · Tempo | Equip | Cues | Progression | Source |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | PL1 | Table Row (Inverted Row) | Back (Lats, Rhomboids) / Biceps, Rear Delts | 3×10 | 60s · 2-0-1-1 | 🏠 Sturdy table | Lie under the table, grip the edge, body straight, pull the chest to the edge and squeeze the shoulder blades. | Feet elevated → Australian Pull-Up | CM |
| [ ] | PL2 | Towel Door Row | Back / Biceps, Grip | 3×12 | 60s · 2-0-1-1 | 🏠 Towel + Door | Towel over a closed door, lean back with straight arms, row the chest to the door. | Single arm → Table Row | CM |
| [ ] | PL3 | Wide Australian Pull-Up | Lats, Upper Back / Rear Delts, Biceps | 3×10 | 75s · 2-0-1-1 | 🟦 Low bar / Table | Wide grip, body straight, pull the chest to the bar, elbows out. | Feet elevated → Archer Row → Pull-Up | CH ✓ / CM |
| [ ] | PL4 | Dead Hang | Grip / Lats, Shoulders | 3×30s | 60s · hold | 🟦 Pull-up bar | Full grip, relax into the hang, shoulders active (not shrugged to the ears). | Active Hang → 100s total daily | CH ✓ / CM |
| [ ] | PL5 | Scapula Pull-Up | Lower Traps, Lats / Grip | 3×10 | 60s · 1-1-1-1 | 🟦 Pull-up bar | From a dead hang, pull the shoulder blades down without bending the arms. Pause at the top. | Negative Pull-Up | CM |
| [ ] | PL6 | Negative Pull-Up | Lats / Biceps, Grip | 3×5 | 90s · 5-0-X-0 | 🟦 Pull-up bar | Jump or step to chin over bar, then lower as slowly as possible to a dead hang. | Pull-Up | CM |
| [ ] | PL7 | Pull-Up | Lats / Biceps, Rear Delts, Core | 3×6 | 120s · 2-0-1-1 | 🟦 Pull-up bar | Overhand grip, start from a dead hang, chest to the bar, no kipping. | Wide → Archer → One-Arm Negative | CH ✓ / CM |
| [ ] | PL8 | Chin-Up | Biceps, Lats / Forearms | 3×6 | 120s · 2-0-1-1 | 🟦 Pull-up bar | Palms facing you, shoulder width. Chin clears the bar, full lockout at the bottom. | Close-grip → Weighted | CM |
| [ ] | PL9 | Archer Pull-Up | Lats / Biceps, Grip | 3×3 / side | 150s · 2-0-1-1 | 🟦 Pull-up bar | Wide grip. Pull toward one hand while the other arm straightens along the bar. | Typewriter → One-Arm Negative | CH / CM |
| [ ] | PL10 | Muscle-Up Negative | Lats, Chest / Triceps, Core | 3×3 | 150s · 5-0-X-0 | 🟦 Pull-up bar | Start above the bar in a straight-arm support. Lower slowly through the dip and the transition to a hang. | Banded → Kipping → Strict Muscle-Up | CH |
| [ ] | PL11 | Tuck Front Lever Hold | Lats, Core / Rear Delts | 3×10s | 120s · hold | 🟦 Pull-up bar | Straight arms, knees tucked, back flat and parallel to the floor. Depress the shoulders. | Advanced Tuck → One-Leg → Full | CH / CM |

## LG: Legs

| ✔ | ID | Name | Primary / Secondary | Default | Rest · Tempo | Equip | Cues | Progression | Source |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | LG1 | Bodyweight Squat | Quads, Glutes / Core | 3×20 | 60s · 2-0-1-0 | 🏠 Floor | Feet shoulder width, chest up, hips below the knees, heels down. | Pause Squat → Jump Squat → Pistol | CH ✓ / CM |
| [ ] | LG2 | Reverse Lunge | Glutes, Quads / Hamstrings | 3×10 / side | 60s · 2-0-1-0 | 🏠 Floor | Step back and lower the back knee to just above the floor. Front shin stays vertical. | Deficit → Bulgarian Split Squat | CH ✓ / CM |
| [ ] | LG3 | Bulgarian Split Squat | Quads, Glutes / Adductors, Core | 3×8 / side | 90s · 3-1-1-0 | 🏠 Chair / Couch | Rear foot on the chair, torso tall, drive through the front heel. | Pause → Jump → Shrimp Squat | CM |
| [ ] | LG4 | Assisted Pistol Squat | Quads, Glutes / Balance, Core | 3×5 / side | 90s · 3-0-1-0 | 🏠 Door frame / Table | Hold a support, sit down on one leg with the other extended forward. Use the hands only as much as needed. | Box Pistol → Pistol Squat | CM |
| [ ] | LG5 | Pistol Squat | Quads, Glutes / Core, Ankles | 3×4 / side | 120s · 3-0-1-0 | 🏠 Floor | Arms forward as a counterweight, heel down, full depth, stand without bouncing. | Elevated → Weighted Pistol | CH / CM |
| [ ] | LG6 | Shrimp Squat | Quads / Glutes, Balance | 3×4 / side | 120s · 3-0-1-0 | 🏠 Floor | Hold the rear foot behind you, lower the rear knee to the floor, stand back up. | Free hand → Advanced Shrimp | CM |
| [ ] | LG7 | Nordic Curl Negative | Hamstrings / Glutes, Lower Back | 3×5 | 120s · 5-0-X-0 | 🏠 Couch / Partner | Ankles anchored, hips straight, lower forward as slowly as possible, catch with the hands. | Partial reps → Full Nordic | CM |
| [ ] | LG8 | Single-Leg Glute Bridge | Glutes / Hamstrings, Core | 3×12 / side | 60s · 2-1-1-0 | 🏠 Floor | Drive through the heel, squeeze the glute at the top, hips level. | Elevated foot → Hip Thrust | CM |
| [ ] | LG9 | Jump Squat | Quads, Glutes / Calves | 3×12 | 75s · 2-0-X-0 | 🏠 Floor | Full squat, explode up, land soft and sink straight into the next rep. | Tuck Jump → Pistol Jump | CH |
| [ ] | LG10 | Single-Leg Calf Raise | Calves / Ankles | 3×15 / side | 45s · 2-1-1-1 | 🏠 Step / Stairs | Heel below the step, rise to full tiptoe, pause at the top. | Slow eccentric → Weighted | CM |

## CO: Core

| ✔ | ID | Name | Primary / Secondary | Default | Rest · Tempo | Equip | Cues | Progression | Source |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | CO1 | Plank Hold | Core / Shoulders, Glutes | 3×45s | 45s · hold | 🏠 Floor | Elbows under shoulders, glutes squeezed, ribs down, straight line. | High Plank → Plank variations | CH ✓ / CM |
| [ ] | CO2 | Low Plank to High Plank | Core / Shoulders, Triceps | 3×40s | 20s · controlled | 🏠 Floor | Walk from forearms to hands and back, keeping the hips from rocking. | Add push-up | CH ✓ |
| [ ] | CO3 | Plank Knee to Elbow | Obliques, Hip Flexors / Deep Core | 3×40s | 20s · controlled | 🏠 Floor | From a high plank, drive the knee to the same-side elbow, shoulders locked in place. | Cross-body → Mountain Climber | CH ✓ |
| [ ] | CO4 | Plank Shrugs (High / Low) | Serratus, Core / Shoulders | 3×40s | 20s · 1-1-1-1 | 🏠 Floor | Keep the arms straight. Let the chest sink between the shoulder blades, then push the floor away. | Pike Shrugs | CH ✓ |
| [ ] | CO5 | Plank to Pike | Core (compression) / Shoulders | 3×40s | 20s · controlled | 🏠 Floor | From a plank, pike the hips high, pushing the shoulders toward the ears, then return. | Pike Push-Up | CH ✓ |
| [ ] | CO6 | Side Plank Reach-Through | Obliques / Thoracic Spine, Shoulders | 3×40s | 20s · controlled | 🏠 Floor | From a side plank, thread the top arm under the torso, then open back up. | Side Plank Raises | CH ✓ |
| [ ] | CO7 | Hollow Body Hold | Abs / Hip Flexors | 3×30s | 45s · hold | 🏠 Floor | Lower back pressed into the floor, arms overhead, legs low, body like a banana. | Hollow Rocks → Dragon Flag | CM |
| [ ] | CO8 | Arch Hold (Superman) | Lower Back, Glutes / Rear Delts | 3×30s | 45s · hold | 🏠 Floor | Lift chest and legs, squeeze the glutes, neck long. | Arch Rocks | CM |
| [ ] | CO9 | Lying Leg Raises | Lower Abs / Hip Flexors | 3×12 | 60s · 2-0-1-0 | 🏠 Floor | Lower back down, legs straight, lower slowly without touching the floor. | Hanging Knee Raises | CH ✓ / CM |
| [ ] | CO10 | Seated In & Outs | Abs / Hip Flexors | 3×15 | 45s · 1-0-1-0 | 🏠 Floor | Sit leaning back on the hands, tuck knees to chest, extend legs out without touching the floor. | Hands-off → V-Ups | CH ✓ |
| [ ] | CO11 | Jackknife (V-Up) | Abs / Hip Flexors | 3×12 | 60s · 1-0-1-0 | 🏠 Floor | Reach hands to toes meeting in the middle, lower with control. | Weighted → Dragon Flag | CH ✓ |
| [ ] | CO12 | Boat Hold | Abs / Hip Flexors, Lower Back | 3×30s | 45s · hold | 🏠 Floor | Balance on the sit bones, legs raised, chest proud, arms forward. | Legs straight → Hollow | CH ✓ |
| [ ] | CO13 | Tuck L-Sit Hold | Abs (compression) / Triceps, Hip Flexors | 3×15s | 60s · hold | 🏠 2 Chairs / Floor 🟪 | Push the floor or chairs away, shoulders down, knees tucked to chest, hips off the floor. | One-Leg L-Sit → L-Sit | CH ✓ / CM |
| [ ] | CO14 | L-Sit Hold | Abs / Triceps, Quads | 3×10s | 90s · hold | 🟪 Parallettes / 2 Chairs | Legs straight and level with the hips, toes pointed, shoulders depressed. | V-Sit | CH ✓ / CM |
| [ ] | CO15 | Russian Twist | Obliques / Abs | 3×20 | 45s · 1-0-1-0 | 🏠 Floor | Lean back with a long spine, rotate the shoulders (not just the arms) side to side. | Feet off floor → Weighted | CH ✓ |
| [ ] | CO16 | Flutter Kicks | Lower Abs / Hip Flexors | 3×30s | 45s · fast | 🏠 Floor | Lower back pressed down, small fast alternating kicks a few inches off the floor. | Hanging Flutter Kicks | CH ✓ |
| [ ] | CO17 | Reverse Plank Hold | Posterior Chain / Shoulders, Glutes | 3×30s | 45s · hold | 🏠 Floor | Hands behind you, hips up in a straight line, chest open. | Reverse Tabletop → Bridge | CH ✓ |
| [ ] | CO18 | Mountain Climbers | Core / Shoulders, Hip Flexors, Cardio | 3×40s | 20s · fast | 🏠 Floor | Hips level with the shoulders, drive the knees fast without bouncing the hips. | Cross-body Climbers | CH ✓ |
| [ ] | CO19 | Hanging Knee Raises | Lower Abs / Grip, Hip Flexors | 3×12 | 60s · 2-0-1-0 | 🟦 Pull-up bar | No swinging. Curl the pelvis up as the knees come to the chest. | Hanging Leg Raises | CH ✓ / CM |
| [ ] | CO20 | Hanging Leg Raises | Abs / Grip, Hip Flexors | 3×8 | 90s · 2-0-1-0 | 🟦 Pull-up bar | Straight legs to at least hip height, control the way down. | Toes-to-Bar | CH ✓ / CM |
| [ ] | CO21 | Toes-to-Bar | Abs / Lats, Grip | 3×6 | 90s · 2-0-1-0 | 🟦 Pull-up bar | Press down on the bar with straight arms while lifting the toes to touch it. | One-Arm Toes-to-Bar | CH ✓ |
| [ ] | CO22 | Dragon Flag | Abs / Lats, Lower Back | 3×4 | 120s · 4-0-1-0 | 🏠 Bench / Sturdy couch edge | Hold behind the head, body rigid from shoulders to toes, lower slowly. | Tuck → One-Leg → Full | CH ✓ |

## SK: Skills & full body

| ✔ | ID | Name | Primary / Secondary | Default | Rest · Tempo | Equip | Cues | Progression | Source |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | SK1 | Crow Pose | Shoulders, Core / Wrists | 3×20s | 60s · hold | 🏠 Floor | Knees on the backs of the upper arms, lean forward until the feet float. | Tuck Planche | CM |
| [ ] | SK2 | Planche Lean | Front Delts, Core / Wrists | 3×20s | 90s · hold | 🏠 Floor | Push-up position, lean the shoulders well past the hands, arms locked, protract. | Tuck Planche | CH / CM |
| [ ] | SK3 | Burpee | Full Body / Cardio | 3×12 | 60s · fast | 🏠 Floor | Chest to floor, snap feet in, jump with hands overhead. | Burpee Pull-Up | CH |
| [ ] | SK4 | Bear Crawl | Full Body / Shoulders, Core | 3×30s | 45s · controlled | 🏠 Floor | Knees an inch off the floor, opposite hand and foot move together, hips steady. | Backwards → Lateral | CH |
| [ ] | SK5 | Skin the Cat | Shoulders, Lats / Core | 3×3 | 120s · slow | 🟦 Bar / ⭕ Rings | From a hang, tuck and rotate the legs through the arms to a German hang, then return. | Back Lever progressions | CM |

---

# Sample workouts

In the app, a workout is a named list of exercises with workout-specific sets × reps, plus a `category`, `difficulty` (1–5), `estimatedMinutes` (must be 15 / 20 / 30 / 40 / 60 to match the home filters) and a `recommendation`. You do all sets of one exercise, with the rest timer between sets, then move to the next.

Each workout below uses only exercises from the catalog above. If you keep a workout but drop one of its exercises, I'll swap in something similar from your picks.

| ✔ | ID | Workout | Diff | Min | Equip | Exercises (sets × reps) | Recommendation |
|---|---|---|---|---|---|---|---|
| [ ] | W1 | Foundations Full Body | 1 | 20 | 🏠 | PU1 3×12 · PL1 3×10 · LG1 3×15 · LG8 2×12/side · CO1 3×30s | Start here. Do it 3× a week on non-consecutive days. When PU1 and PL1 feel easy at 12+, move to W2–W4. |
| [ ] | W2 | Push Day | 3 | 30 | 🏠 | PU3 4×12 · VP1 3×8 · PU5 3×10 · VP5 3×12 · PU4 2×8 | Chest, shoulders and triceps. Pair with W3 the next day. |
| [ ] | W3 | Pull & Posture (home) | 2 | 20 | 🏠 | PL1 4×10 · PL2 3×12 · CO8 3×30s · CO4 2×40s | No bar needed. Counterbalances all the pushing and helps desk posture. |
| [ ] | W3b | Pull Day (bar) | 3 | 30 | 🟦 | PL5 3×10 · PL6 3×5 · PL3 3×10 · PL8 3×6 · PL4 2×30s | Bar version of W3. Builds toward your first strict pull-ups. |
| [ ] | W4 | Leg Day | 3 | 30 | 🏠 | LG3 3×8/side · LG2 3×10/side · LG4 3×5/side · LG7 3×5 · LG10 3×15/side | Single-leg focus is how you overload legs without weights. Rest well before a W2. |
| [ ] | W5 | Plank Burner (Heria-style) | 2 | 15 | 🏠 | CO2 2×40s · CO3 2×40s · CO4 2×40s · CO5 2×40s · CO6 2×40s · CO1 1×60s | Based on Heria's daily plank routine. Good as a short standalone or a finisher. |
| [ ] | W6 | Arms Without Weights (Heria-style) | 3 | 20 | 🏠 | PU7 3×8 · PL1 3×10 · VP7 3×10 · VP5 3×12 · VP1 3×8 | Based on Heria's no-weights arm session. Biceps via pseudo planche and rows, triceps via skull crushers and dips. |
| [ ] | W7 | Core Compression | 3 | 20 | 🏠 | CO7 3×30s · CO10 3×15 · CO11 3×12 · CO13 3×15s · CO16 3×30s | Builds the hollow and compression strength behind L-sits and handstands. |
| [ ] | W8 | Upper Strength | 4 | 40 | 🟦🟪 | PL7 4×6 · VP6 4×8 · PL8 3×6 · PU6 3×6/side · CO19 3×12 · PL4 1×60s | Classic Calisthenicmovement-style push/pull pairing. Needs a bar and dip station (or 2 sturdy chairs for dips). |
| [ ] | W9 | Conditioning | 4 | 30 | 🏠 | SK3 3×12 · LG9 3×12 · CO18 3×40s · PU9 3×6 · SK4 3×30s | Heart rate up, short rests. Use it on a day you don't feel like strength work. |
| [ ] | W10 | Skill Day | 5 | 60 | 🏠🟦🟪 | VP3 4×30s · VP4 4×4 · SK2 3×20s · PU7 3×8 · PL11 4×10s · CO14 4×10s · CO22 3×4 · SK1 3×20s | Handstand, planche, front lever and L-sit work. Do skills first while fresh. Advanced only. |

### Example weekly plans

- **Beginner (3 days):** Mon W1 · Wed W1 · Fri W1, plus W5 on any off day if you want more.
- **Intermediate home (4 days):** Mon W2 · Tue W3 · Thu W4 · Fri W6, plus W7 or W5 as a finisher.
- **Intermediate with a bar (4 days):** Mon W2 · Tue W3b · Thu W4 · Sat W8.

### What the current app can't do yet

- **Circuits / intervals:** Heria's videos are mostly 40s on / 20s off circuits run in rounds. The app only does straight sets, so W5 approximates it with 2 sets of 40s. A `format: "circuit"` workout type with work/rest seconds and rounds would match his style properly.
- **Per-workout hold times:** a workout entry only has `reps`. Holds always use the exercise's `defaultDuration`, so you can't say "30s here, 60s there". Adding an optional `duration` to the workout entry would fix that.

---

## Possible data structure changes (for later)

Nothing changes yet. These came up while building the list:

- **Per-side reps:** many picks are unilateral (`/ side`), and the schema can't express that. A `perSide: true` flag would fix it.
- **Equipment as tags:** `equipment` is free text. A fixed list (`floor`, `chair`, `bar`, `dip-bars`, `rings`) would allow an "equipment I have" filter on the home screen.
- **Level / difficulty per exercise:** progressions like Push-Up → Archer → One-Arm could link exercises by ID (`progressesTo: "PU11"`) instead of plain text.
- **Video link:** an optional `videoUrl` to the relevant Heria / Calisthenicmovement tutorial.

## Sources

- THENX: [Push-Ups LVL 1–10](https://thenx.com/blogs/news/bodybuilder-push-ups-lvl-1-10-tristyn-lee)
- THENX: [Ranking 6 Pack Abs Exercises](https://thenx.com/blogs/news/article-5)
- THENX: [Plank Routine You Can Do Everyday](https://thenx.com/blogs/news/3)
- THENX: [Bigger Arms Without Weights](https://thenx.com/blogs/news/4)
- THENX: [Complete 10 Min Home Workout](https://thenx.com/blogs/news/1)
- THENX blog index: <https://thenx.com/blogs/news>
- Calisthenicmovement: [YouTube channel](https://www.youtube.com/@calisthenicmovement) (entries marked **CM** need checking against the videos)
