using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TurfDRS.EditorTools
{
    /// <summary>
    /// Headless WebGL builder for the DRS review scene. Builds and runs from the
    /// command line without the editor UI:
    ///
    ///   Unity.exe -batchmode -quit -projectPath unity/drs \
    ///            -executeMethod TurfDRS.EditorTools.DRSWebGLBuilder.BuildWebGL -logFile -
    ///
    /// Output is written straight into the Next.js public folder so WebGL build
    /// (Build/drs.*) and StreamingAssets land where the page expects them.
    /// </summary>
    public static class DRSWebGLBuilder
    {
        public static void BuildWebGL()
        {
            var projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            var outputDir = Path.Combine(projectRoot, "public", "unity", "drs");

            Debug.Log($"[DRS] Project root: {projectRoot}");
            Debug.Log($"[DRS] Output dir:   {outputDir}");

            CreateAndSaveScene(Path.Combine(projectRoot, "unity", "drs", "Assets", "Scenes", "DRS.unity"));

            if (!EditorBuildSettings.scenes.Exists(s => s.path.EndsWith("/Scenes/DRS.unity")))
            {
                EditorBuildSettings.scenes = new[]
                {
                    new EditorBuildSettingsScene("Assets/Scenes/DRS.unity", true),
                };
            }

            PlayerSettings.productName = "Turf DRS";
            PlayerSettings.companyName = "Turf DRS";
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.runInBackground = true;
            PlayerSettings.WebGL.memorySize = 64;

            if (!EditorUserBuildSettings.SwitchActiveBuildTarget(
                    BuildTargetGroup.WebGL, BuildTarget.WebGL))
            {
                Debug.LogError("[DRS] Failed to switch active build target to WebGL.");
            }

            Directory.CreateDirectory(outputDir);
            var report = BuildPipeline.BuildPlayer(
                EditorBuildSettings.scenes,
                outputDir,
                BuildTarget.WebGL,
                BuildOptions.None);

            var summary = report.summary;
            Debug.Log($"[DRS] Build finished: result={summary.result} size={summary.totalSize}B elapsed={summary.totalTime}");
            if (summary.result != BuildResult.Succeeded)
                throw new System.Exception($"[DRS] Build failed: {summary.result}");

            Debug.Log($"[DRS] Success — WebGL output at {outputDir}");
        }

        private static void CreateAndSaveScene(string absolutePath)
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "DRS";

            var camGo = new GameObject("Main Camera");
            camGo.tag = "MainCamera";
            var cam = camGo.AddComponent<Camera>();
            cam.fieldOfView = 52f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.027f, 0.055f, 0.035f);
            camGo.transform.position = new Vector3(0.12f, 1.05f, -5.6f);
            camGo.transform.LookAt(new Vector3(0f, 0.35f, 2.4f));

            var lightGo = new GameObject("Key Light");
            lightGo.transform.rotation = Quaternion.Euler(48f, -38f, 0f);
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = Color.white;
            light.intensity = 1.4f;

            var bridgeGo = new GameObject("DrsBridge");
            bridgeGo.AddComponent<DRSBridge>();

            var dir = Path.GetDirectoryName(absolutePath);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

            var relative = relativePath(absolutePath);
            EditorSceneManager.SaveScene(scene, relative);
            if (!EditorBuildSettings.scenes.Exists(s => s.path == relative))
            {
                var scenes = new EditorBuildSettingsScene[EditorBuildSettings.scenes.Length + 1];
                System.Array.Copy(EditorBuildSettings.scenes, scenes, EditorBuildSettings.scenes.Length);
                scenes[scenes.Length - 1] = new EditorBuildSettingsScene(relative, true);
                EditorBuildSettings.scenes = scenes;
            }
        }

        private static string relativePath(string absolute)
        {
            var full = Path.GetFullPath(absolute);
            var project = Path.GetFullPath(Path.Combine(Application.dataPath, ".."));
            return full.StartsWith(project)
                ? full.Substring(project.Length).TrimStart('\\', '/').Replace('\\', '/')
                : full;
        }
    }
}