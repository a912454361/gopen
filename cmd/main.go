package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/a912454361/gopen/internal/auth"
	"github.com/a912454361/gopen/internal/database"
	"github.com/a912454361/gopen/internal/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func getExeDir() string {
	exePath, err := os.Executable()
	if err != nil {
		return "."
	}
	return filepath.Dir(exePath)
}

func main() {
	exeDir := getExeDir()

	if err := godotenv.Load(filepath.Join(exeDir, ".env")); err != nil {
		log.Println("Warning: .env file not found")
	}

	os.Chdir(exeDir)

	if err := database.Init(); err != nil {
		log.Fatalf("Failed to init database: %v", err)
	}

	authService := auth.NewService(database.GetDB())
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:8080"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	r.Static("/static", "./web/static")
	r.LoadHTMLGlob("web/templates/*")

	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(authService)

	api := r.Group("/api")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/refresh", authHandler.RefreshToken)
		api.GET("/auth/github", authHandler.GitHubLogin)
		api.GET("/auth/google", authHandler.GoogleLogin)
		api.GET("/auth/callback/:provider", authHandler.OAuthCallback)
		authorized := api.Group("/")
		authorized.Use(handlers.Middleware(authService))
		{
			authorized.GET("/user/profile", userHandler.GetProfile)
			authorized.PUT("/user/profile", userHandler.UpdateProfile)
			authorized.POST("/auth/logout", authHandler.Logout)
		}
	}

	r.GET("/", func(c *gin.Context) { c.HTML(200, "index.html", nil) })
	r.GET("/login", func(c *gin.Context) { c.HTML(200, "login.html", nil) })
	r.GET("/register", func(c *gin.Context) { c.HTML(200, "register.html", nil) })
	r.GET("/dashboard", func(c *gin.Context) { c.HTML(200, "dashboard.html", nil) })

	log.Printf("Server starting on http://localhost:8080")
	r.Run(":8080")
}
