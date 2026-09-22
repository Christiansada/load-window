# Demonstration plan — real application

Repository: https://github.com/Christiansada/load-window

App: https://christiansada.github.io/load-window/

A 90-second screen-recording plan; no video is bundled. Use the working interface and keep the synthetic-example label visible.

1. **Problem (0–15 s):** three flexible loads share a power budget. Cheap individual start times can conflict. Explain that the example values are invented.
2. **Inputs (15–35 s):** show the 24 hourly rates, base demand, cap, and load windows. Explain that each cycle is continuous and must finish by its deadline.
3. **Output (35–55 s):** read the baseline/scheduled costs and unchanged total energy. Show the actual chosen start times, demand bars, and the 24-hour detail table.
4. **Interaction (55–70 s):** set the cap to 0.1 kW. Old results disappear. Run the solver to show no feasible schedule. Reset the sample.
5. **Technical value (70–80 s):** download a JSON review and inspect its inputs, complete results, counts, and units. The bounded solver checks all permitted starts.
6. **Limits and invitation (80–90 s):** mention hourly constant-power assumptions and no equipment control. Point to the source, tests, and contribution ideas.

Do not call the example cost reduction measured savings. Do not present this as an electrical safety tool or claim a battery simulation. Deployment status and verification evidence are recorded in the daily run report outside the source repository.
