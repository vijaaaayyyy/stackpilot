using UnityEngine;
using UnityEngine.Rendering;

namespace TurfDRS
{
    /// <summary>
    /// Runtime brain for the Unity DRS replay scene. Builds the pitch, stumps,
    /// corridor and ball procedurally (same layout as the three.js fallback) and
    /// exposes a small command surface for the page via Unity's SendMessage:
    ///   DrsBridge.SetFrame(int)   DrsBridge.SetView(int)
    ///   DrsBridge.SetPhase(string)   DrsBridge.SetZoom(float)
    ///   DrsBridge.SetOverlays(bool)
    /// Events flow Unity -> page through the WebGL jslib (drs_bridge.jslib).
    /// </summary>
    public class DRSBridge : MonoBehaviour
    {
        // ---- Unity -> page bridge (WebGL only; safe no-ops elsewhere) ----
        [System.Runtime.InteropServices.DllImport("__Internal")]
        private static extern void drs_onReady();

        [System.Runtime.InteropServices.DllImport("__Internal")]
        private static extern void drs_onFrame(int frame);

        [System.Runtime.InteropServices.DllImport("__Internal")]
        private static extern void drs_onImpact();

        public const int TotalFrames = 240;

        private const float PitchWidth = 1.54f;
        private const float PitchLength = 7.0f;
        private const float CreaseZ = 0.72f;
        private const float StumpHeight = 0.71f;
        private const float CorridorHalf = 0.16f;
        private const float StumpZTop = 0.24f;

        private int frame;
        private int view; // 0 umpire, 1 top, 2 square-leg
        private float zoom = 1f;
        private bool overlays = true;
        private int lastSentFrame = -1;

        private Transform ball;
        private Transform impactMarker;
        private GameObject corridor;
        private Camera cam;

        private static readonly Vector3 ReleaseP = new Vector3(0.35f, 2.3f, -5.6f);
        private static readonly Vector3 BounceP = new Vector3(0.15f, 0.02f, 1.05f);
        private static readonly Vector3 WicketP = new Vector3(0.05f, 0.72f, 0f);

        private static readonly (Vector3 pos, Vector3 look)[] Rigs =
        {
            (new Vector3(0.12f, 1.05f, -5.6f), new Vector3(0f, 0.35f, 2.4f)),  // umpire
            (new Vector3(0f, 9.4f, 0.01f), new Vector3(0f, 0f, 0f)),          // top
            (new Vector3(2.9f, 1.15f, 1.5f), new Vector3(0f, 0.4f, 1.1f)),    // square-leg
        };

        private Vector3 currentPos;
        private Vector3 currentLook;

        private void Start()
        {
            cam = Camera.main;
            if (cam == null) { cam = CreateCamera(); }
            BuildPitch();
            if (Application.platform == RuntimePlatform.WebGLPlayer) drs_onReady();
            ApplyCamera();
            ApplyBall();
        }

        private void Update()
        {
            // Smooth camera travel between rigs.
            var target = Rigs[Mathf.Clamp(view, 0, Rigs.Length - 1)];
            float t = 1f - Mathf.Exp(-6f * Time.deltaTime);
            currentPos = Vector3.Lerp(currentPos, target.pos, t);
            currentLook = Vector3.Lerp(currentLook, target.look, t);
            if (cam != null)
            {
                cam.transform.position = currentPos;
                cam.transform.LookAt(currentLook);
            }
        }

        // ---------------------------- Commands ---------------------------------

        public void SetFrame(int value)
        {
            var next = Mathf.Clamp(value, 0, TotalFrames);
            bool crossedImpact = frame < 148 && next >= 148;
            frame = next;
            ApplyBall();
            if (crossedImpact && overlays && Application.platform == RuntimePlatform.WebGLPlayer)
                drs_onImpact();
            EmitFrame();
        }

        public void SetView(int value)
        {
            view = Mathf.Clamp(value, 0, Rigs.Length - 1);
            ApplyCamera();
        }

        public void SetPhase(string value)
        {
            // "capture" | "analysis" | "reveal" â€” future staging hook.
            overlays = value != "reveal";
            SetOverlaysCache();
        }

        public void SetZoom(float value)
        {
            zoom = Mathf.Max(0.5f, value);
            if (cam != null) cam.fieldOfView = 52f / zoom;
        }

        public void SetOverlays(bool value)
        {
            overlays = value;
            SetOverlaysCache();
        }

        public void PlayFromStart()
        {
            frame = 0;
            ApplyBall();
            EmitFrame();
        }

        // ----------------------------- Internal ---------------------------------

        private void SetOverlaysCache()
        {
            if (corridor != null) corridor.SetActive(overlays);
            if (impactMarker != null) impactMarker.gameObject.SetActive(overlays && frame >= 148);
        }

        private void EmitFrame()
        {
            if (frame == lastSentFrame) return;
            lastSentFrame = frame;
            if (Application.platform == RuntimePlatform.WebGLPlayer) drs_onFrame(frame);
        }

        private void ApplyBall()
        {
            if (ball == null) return;
            float t = frame / (float)TotalFrames;
            Vector3 pos;
            if (t < 0.62f)
            {
                float k = t / 0.62f;
                pos = Parabola(ReleaseP, BounceP, k, 2.2f);
            }
            else
            {
                float k = Mathf.Clamp01((t - 0.62f) / 0.38f);
                pos = Parabola(BounceP, WicketP, k, 0.72f);
            }
            ball.position = pos;
            ball.localScale = pos.y > 0.2f && t < 0.62f ? Vector3.one * (1.4f - t * 0.4f) : Vector3.one;
            if (impactMarker != null)
                impactMarker.gameObject.SetActive(overlays && frame >= 148);
        }

        private static Vector3 Parabola(Vector3 a, Vector3 b, float k, float apex)
        {
            var mid = Vector3.Lerp(a, b, 0.5f);
            mid.y += Mathf.Max(0.1f, apex - 0.5f * (a.y + b.y));
            float oneMinus = (1f - k);
            return oneMinus * oneMinus * a + 2f * oneMinus * k * mid + k * k * b;
        }

        private Camera CreateCamera()
        {
            var go = new GameObject("Main Camera");
            go.tag = "MainCamera";
            var c = go.AddComponent<Camera>();
            c.fieldOfView = 52f;
            c.clearFlags = CameraClearFlags.SolidColor;
            c.backgroundColor = new Color(0.027f, 0.055f, 0.035f);
            c.position = Rigs[0].pos;
            return c;
        }

        private void ApplyCamera()
        {
            if (cam == null) return;
            var target = Rigs[Mathf.Clamp(view, 0, Rigs.Length - 1)];
            currentPos = target.pos;
            currentLook = target.look;
            cam.transform.position = currentPos;
            cam.transform.LookAt(currentLook);
            cam.fieldOfView = 52f / zoom;
        }

        // ---------------------------- Pitch --------------------------------------

        private void BuildPitch()
        {
            var root = new GameObject("DRS Scene");

            // Ground and pitch strip (matching the three.js layout).
            CreatePlane(root.transform, new Vector2(26f, 20f), new Color(0.04f, 0.12f, 0.078f), Vector3.zero, "Ground");
            CreatePlane(root.transform, new Vector2(PitchWidth, PitchLength), new Color(0.14f, 0.26f, 0.17f), new Vector3(0f, 0.005f, 0f), "Pitch");

            // Pitch edges.
            foreach (var x in new float[] { -PitchWidth / 2f, PitchWidth / 2f })
            {
                var edge = GameObject.CreatePrimitive(PrimitiveType.Cube);
                edge.name = "Pitch Edge";
                edge.transform.SetParent(root.transform, false);
                edge.transform.localScale = new Vector3(0.02f, 0.02f, PitchLength);
                edge.transform.position = new Vector3(x, 0.012f, 0f);
                edge.GetComponent<Renderer>().sharedMaterial = Solid(new Color(0.18f, 0.35f, 0.21f));
            }

            // Creases + return lines.
            AddLine(root.transform, new Vector3(-PitchWidth * 0.45f, 0.02f, -CreaseZ), new Vector3(PitchWidth * 0.45f, 0.02f, -CreaseZ));
            AddLine(root.transform, new Vector3(-PitchWidth * 0.45f, 0.02f, CreaseZ), new Vector3(PitchWidth * 0.45f, 0.02f, CreaseZ));
            AddLine(root.transform, new Vector3(-PitchWidth * 0.5f, 0.02f, -CreaseZ), new Vector3(-PitchWidth * 0.52f, 0.02f, -CreaseZ + 0.28f));
            AddLine(root.transform, new Vector3(PitchWidth * 0.5f, 0.02f, -CreaseZ), new Vector3(PitchWidth * 0.52f, 0.02f, -CreaseZ + 0.28f));
            AddLine(root.transform, new Vector3(-PitchWidth * 0.5f, 0.02f, CreaseZ), new Vector3(-PitchWidth * 0.52f, 0.02f, CreaseZ - 0.28f));
            AddLine(root.transform, new Vector3(PitchWidth * 0.5f, 0.02f, CreaseZ), new Vector3(PitchWidth * 0.52f, 0.02f, CreaseZ - 0.28f));

            // Stumps + bails at both ends.
            AddStumps(root.transform, -CreaseZ);
            AddStumps(root.transform, CreaseZ);

            // Corridor (pitched-in-line band + rails + gates).
            corridor = BuildCorridor();
            corridor.transform.SetParent(root.transform, false);

            // Impact marker.
            impactMarker = CreatePrimitive("Impact Marker", PrimitiveType.Cylinder, root.transform);
            impactMarker.localScale = new Vector3(0.24f, 0.012f, 0.18f);
            impactMarker.localRotation = Quaternion.Euler(90f, 0f, 0f);
            impactMarker.position = new Vector3(BounceP.x, 0.05f, BounceP.z);
            impactMarker.GetComponent<Renderer>().sharedMaterial = Solid(new Color(0.49f, 0.95f, 0.61f));
            impactMarker.gameObject.SetActive(false);

            // The ball.
            ball = GameObject.CreatePrimitive(PrimitiveType.Sphere).transform;
            ball.name = "Ball";
            ball.SetParent(root.transform, false);
            ball.localScale = Vector3.one * 0.9f;
            var ballGo = ball.gameObject;
            var mat = ballGo.GetComponent<Renderer>().sharedMaterial = new Material(Shader.Find("Standard"))
            {
                color = new Color(0.98f, 0.97f, 0.95f),
                smoothness = 0.9f, metallic = 0f,
            };
        }

        private GameObject BuildCorridor()
        {
            var group = new GameObject("Corridor");
            var band = CreatePrimitive("Corridor Band", PrimitiveType.Cube, group.transform);
            band.localScale = new Vector3(CorridorHalf * 2f, 0.012f, PitchLength * 1.05f);
            band.localRotation = Quaternion.Euler(90f, 0f, 0f);
            band.position = new Vector3(0f, 0.012f, 0f);
            band.GetComponent<Renderer>().sharedMaterial = new Material(Shader.Find("Standard"))
            {
                color = new Color(0.49f, 0.95f, 0.61f, 0.16f), smoothness = 0.6f,
            };

            foreach (var x in new float[] { -CorridorHalf, CorridorHalf })
            {
                var rail = CreatePrimitive("Corridor Rail", PrimitiveType.Cube, group.transform);
                rail.localScale = new Vector3(0.045f, 0.018f, PitchLength * 0.75f);
                rail.position = new Vector3(x, 0.02f, 0f);
                rail.GetComponent<Renderer>().sharedMaterial = new Material(Shader.Find("Standard"))
                {
                    color = new Color(0.49f, 0.95f, 0.61f, 0.95f),
                };
            }

            foreach (var z in new float[] { -CreaseZ, CreaseZ })
            {
                var gate = CreatePrimitive("Corridor Gate", PrimitiveType.Cube, group.transform);
                gate.localScale = new Vector3(CorridorHalf * 2f, 0.012f, 0.02f);
                gate.position = new Vector3(0f, 0.03f, z);
            }

            group.SetActive(overlays);
            return group;
        }

        private void AddStumps(Transform parent, float z)
        {
            for (int i = -1; i <= 1; i++)
            {
                var stump = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                stump.name = "Stump";
                stump.transform.SetParent(parent, false);
                stump.transform.localScale = new Vector3(0.09f, StumpHeight, 0.09f);
                stump.transform.position = new Vector3(i * 0.09f, StumpHeight / 2f, z);
                stump.GetComponent<Renderer>().sharedMaterial = new Material(Shader.Find("Standard"))
                {
                    color = new Color(0.62f, 0.4f, 0.15f), smoothness = 0.5f,
                };
            }
            for (int k = 0; k < 2; k++)
            {
                var bail = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                float x = k == 0 ? -0.09f : 0.09f;
                bail.name = "Bail";
                bail.transform.SetParent(parent, false);
                bail.transform.localScale = new Vector3(0.07f, 0.08f, 0.07f);
                bail.transform.position = new Vector3(x, StumpHeight + 0.04f, z);
                bail.transform.localRotation = Quaternion.Euler(0f, 0f, 0f);
                bail.GetComponent<Renderer>().sharedMaterial = new Material(Shader.Find("Standard"))
                {
                    color = new Color(0.96f, 0.87f, 0.66f), smoothness = 0.7f,
                };
            }
        }

        private static Material Solid(Color color)
        {
            return new Material(Shader.Find("Standard")) { color = color, smoothness = 0.5f, };
        }

        private static Transform CreatePlane(Transform parent, Vector2 size, Color color, Vector3 position, string name)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Plane);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localScale = new Vector3(size.x / 10f, 1f, size.y / 10f);
            go.transform.position = position;
            go.GetComponent<Renderer>().sharedMaterial = Solid(color);
            return go.transform;
        }

        private static Transform CreatePrimitive(string name, PrimitiveType type, Transform parent)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent, false);
            return go.transform;
        }

        private static LineRenderer AddLine(Transform parent, Vector3 a, Vector3 b)
        {
            var go = new GameObject("Crease");
            go.transform.SetParent(parent, false);
            var lr = go.AddComponent<LineRenderer>();
            lr.positionCount = 2;
            lr.SetPosition(0, a);
            lr.SetPosition(1, b);
            lr.startWidth = 0.015f;
            lr.endWidth = 0.015f;
            var m = new Material(Shader.Find("Standard")) { color = new Color(1f, 1f, 1f, 0.6f) };
            lr.sharedMaterial = m;
            return lr;
        }
    }
}
